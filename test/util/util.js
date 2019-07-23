const fs = require('fs');
const path = require('path');
const solc = require('solc');
const TruffleContract = require('truffle-contract');

const Instrumenter = require('./../../lib/instrumenter');
const DataCollector = require('./../../lib/collector')

const filePath = path.resolve('./test.sol');
const pathPrefix = './';

function getCode(_path) {
  const pathToSources = `./../soliditySources/contracts/${_path}`;
  return fs.readFileSync(path.join(__dirname, pathToSources), 'utf8');
};

function getABI(solcOutput, testFile="test.sol", testName="Test"){
  return solcOutput.contracts[testFile][testName].abi;
}

function getBytecode(solcOutput, testFile="test.sol", testName="Test"){
  return `0x${solcOutput.contracts[testFile][testName].evm.bytecode.object}`;
}

async function getDeployedContractInstance(info, provider){

  const contract = TruffleContract({
    abi: getABI(info.solcOutput),
    bytecode: getBytecode(info.solcOutput)
  })

  contract.setProvider(provider);

  const accounts = await contract.web3.eth.getAccounts();
  contract.defaults({
    gas: 5500000,
    gasPrice: 1,
    from: accounts[0]
  });

  return contract.new();
}

function compile(source){
  const compilerInput = codeToCompilerInput(source);
  return JSON.parse(solc.compile(compilerInput));
}

function report(output=[]) {
  output.forEach(item => {
    if (item.severity === 'error') {
      const errors = JSON.stringify(output, null, ' ');
      throw new Error(`Instrumentation fault: ${errors}`);
    }
  });
}

function instrumentAndCompile(sourceName) {
  const contract = getCode(`${sourceName}.sol`)
  const instrumenter = new Instrumenter();
  const instrumented = instrumenter.instrument(contract, filePath);
  return {
    contract: contract,
    instrumented: instrumented,
    solcOutput: compile(instrumented.contract),
    data: instrumenter.instrumentationData
  }
}

function codeToCompilerInput(code) {
	return JSON.stringify({
    language: 'Solidity',
    sources: { 'test.sol': { content: code } },
    settings: { outputSelection: {'*': { '*': [ '*' ] }} }
  });
}

async function bootstrapCoverage(file, provider, collector){
  const info = instrumentAndCompile(file);
  info.instance = await getDeployedContractInstance(info, provider);
  collector._setInstrumentationData(info.data);
  return info;
}

async function initializeProvider(ganache){
  const provider = ganache.provider();

  return new Promise(resolve => {
    const interval = setInterval(() => {

      if (provider.engine.manager.state.blockchain.vm !== undefined){
        clearInterval(interval);

        resolve({
          provider: provider,
          collector: new DataCollector({provider: provider})
        });
      }
    });
  })
}

module.exports = {
  pathPrefix: pathPrefix,
  filePath: filePath,
  report: report,
  instrumentAndCompile: instrumentAndCompile,
  bootstrapCoverage: bootstrapCoverage,
  initializeProvider: initializeProvider,
}
