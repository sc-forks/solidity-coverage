/* eslint-env node, mocha */
/* global artifacts, contract, assert */

const Web3 = require('web3');
const ethUtil = require('ethereumjs-util');

const provider = new Web3.providers.HttpProvider('http://localhost:8555'); // testrpc-sc
const web3 = new Web3(provider);
const Simple = artifacts.require('./Simple.sol');

contract('Simple', accounts => {
  it('should set x to 5', () => {
    let simple;
    return Simple.deployed()
        .then(instance => instance.test(5)) // We need this line to generate some coverage
        .then(() => {
          const message = 'Enclosed is my formal application for permanent residency in New Zealand';
          const messageSha3 = web3.sha3(message);
          const signature = web3.eth.sign(accounts[0], messageSha3);

          const messageBuffer = new Buffer(messageSha3.replace('0x', ''), 'hex');
          const messagePersonalHash = ethUtil.hashPersonalMessage(messageBuffer);

          const sigParams = ethUtil.fromRpcSig(signature);
          const publicKey = ethUtil.ecrecover(messagePersonalHash, sigParams.v, sigParams.r, sigParams.s);
          const senderBuffer = ethUtil.pubToAddress(publicKey);
          const sender = ethUtil.bufferToHex(senderBuffer);
          assert.equal(sender, accounts[0]);
        });
  });
});