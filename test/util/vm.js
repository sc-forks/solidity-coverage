const solc = require('solc');
const shell = require('shelljs');
const fs = require('fs');
const VM = require('ethereumjs-vm');
const Account = require('ethereumjs-account');
const Transaction = require('ethereumjs-tx');
const utils = require('ethereumjs-util');
const CryptoJS = require('crypto-js');
const Trie = require('merkle-patricia-tree');
const coder = require('web3/lib/solidity/coder.js');

// Don't use this address for anything, obviously!
const secretKey = 'e81cb653c260ee12c72ec8750e6bfd8a4dc2c3d7e3ede68dd2f150d0a67263d8';
const accountAddress = new Buffer('7caf6f9bc8b3ba5c7824f934c826bd6dc38c8467', 'hex');

/**
 * Encodes function data
 * Source: consensys/eth-lightwallet/lib/txutils.js (line 18)
 */
function encodeFunctionTxData(functionName, types, args) {
  const fullName = `${functionName}(${types.join()})`;
  const signature = CryptoJS.SHA3(fullName, {
    outputLength: 256,
  }).toString(CryptoJS.enc.Hex).slice(0, 8);
  const dataHex = signature + coder.encodeParams(types, args);
  return `0x${dataHex}`;
}

/**
 * Extracts types from abi
 * Source: consensys/eth-lightwallet/lib/txutils.js (line 27)
 */
function getTypesFromAbi(abi, functionName) {
  function matchesFunctionName(json) {
    return (json.name === functionName && json.type === 'function');
  }
  function getTypes(json) {
    return json.type;
  }
  const funcJson = abi.filter(matchesFunctionName)[0];

  return funcJson ? (funcJson.inputs).map(getTypes) : [];
}

/**
 * Retrieves abi for contract
 * Source: raineorshine/eth-new-contract/src/index.js (line 8)
 * @param  {String} source      solidity contract
 * @param  {Object} compilation compiled `source`
 * @return {Object}             abi
 */
function getAbi(source, compilation) {
  const contractNameMatch = source.match(/(?:contract)\s([^\s]*)\s*{/);
  if (!contractNameMatch) {
    throw new Error('Could not parse contract name from source.');
  }
  const contractName = contractNameMatch[1];
  return JSON.parse(compilation.contracts[':' + contractName].interface);
}

/**
 * Creates, funds and publishes account to Trie
 */
function createAccount(trie) {
  const account = new Account();
  account.balance = 'f00000000000000000';
  trie.put(accountAddress, account.serialize());
}

/**
 * Deploys contract represented by `code`
 * @param  {String}   code contract bytecode
 */

function deploy(vm, code) {
  const tx = new Transaction({
    gasPrice: '1', gasLimit: 'ffffff', data: code,
  });
  tx.sign(new Buffer(secretKey, 'hex'));

  return new Promise((resolve, reject) => {
    vm.runTx({
      tx,
    }, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results.createdAddress);
      }
    });
  });
}

/**
 * Invokes `functionName` with `args` on contract at `address`. Tx construction logic
 * is poached from consensys/eth-lightwallet/lib/txutils:functionTx
 * @param  {Array}  abi          contract abi
 * @param  {String} address      deployed contract to invoke method on
 * @param  {String} functionName method to invoke
 * @param  {Array} args          functionName's arguments
 * @return {Promise}             resolves array of logged events
 */
function callMethod(vm, abi, address, functionName, args) {
  const types = getTypesFromAbi(abi, functionName);
  const txData = encodeFunctionTxData(functionName, types, args);
  const options = {
    gasPrice: '0x1',
    gasLimit: '0xffffff',
    to: utils.bufferToHex(address),
    data: txData,
    nonce: '0x1',
  };

  const tx = new Transaction(options);
  tx.sign(new Buffer(secretKey, 'hex'));

  return new Promise(resolve => {
    vm.runTx({
      tx,
    }, (err, results) => {
      try {
        const events = fs.readFileSync('./allFiredEvents').toString().split('\n');
        events.pop();
        shell.rm('./allFiredEvents');
        resolve(events);
      } catch (e) {
        resolve([]);
      }
    });
  });
}

/**
 * Runs method `functionName` with parameters `args` on contract. Resolves a
 * CR delimited list of logged events.
 * @param  {String} contract     solidity to compile
 * @param  {String} functionName method to invoke on contract
 * @param  {Array} args          parameter values to pass to method
 * @return {Promise}             resolves array of logged events.
 */
module.exports.execute = function ex(contract, functionName, args) {
  const output = solc.compile(contract, 1);
  const code = new Buffer(output.contracts[':Test'].bytecode, 'hex');
  const abi = getAbi(contract, output);
  const stateTrie = new Trie();
  const vm = new VM({
    state: stateTrie,
  });

  createAccount(stateTrie);
  return deploy(vm, code).then(address => callMethod(vm, abi, address, functionName, args));
};
