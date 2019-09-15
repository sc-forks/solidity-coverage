/**
 * Setup and reporting helpers for the suites which test instrumentation
 * and coverage correctness. (Integration test helpers are elsewhere)
 */
const fs = require('fs');
const path = require('path');
const solc = require('solc');
const TruffleContract = require('truffle-contract');

const Instrumenter = require('./../../lib/instrumenter');
const DataCollector = require('./../../lib/collector')

// ====================
// Paths / Files
// ====================
const filePath = path.resolve('./test.sol');
const pathPrefix = './';

// ====================
// Contract deployments
// ====================
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
  contract.autoGas = false;

  const accounts = await contract.web3.eth.getAccounts();
  contract.defaults({
    gas: 5500000,
    gasPrice: 1,
    from: accounts[0]
  });

  return contract.new();
}

// ============
// Compilation
// ============
function getCode(_path) {
  const pathToSources = `./../sources/solidity/contracts/${_path}`;
  return fs.readFileSync(path.join(__dirname, pathToSources), 'utf8');
};

function compile(source){
  const compilerInput = codeToCompilerInput(source);
  return JSON.parse(solc.compile(compilerInput));
}

function codeToCompilerInput(code) {
  return JSON.stringify({
    language: 'Solidity',
    sources: { 'test.sol': { content: code } },
    settings: { outputSelection: {'*': { '*': [ '*' ] }} }
  });
}

// ============================
// Instrumentation Correctness
// ============================
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

function report(output=[]) {
  output.forEach(item => {
    if (item.severity === 'error') {
      const errors = JSON.stringify(output, null, ' ');
      throw new Error(`Instrumentation fault: ${errors}`);
    }
  });
}

// =====================
// Coverage Correctness
// =====================
async function bootstrapCoverage(file, provider, collector){
  const info = instrumentAndCompile(file);
  info.instance = await getDeployedContractInstance(info, provider);
  collector._setInstrumentationData(info.data);
  return info;
}

// =========
// Provider
// =========
function initializeProvider(ganache){
  const collector = new DataCollector();
  const options = { logger: { log: collector.step.bind(collector) }};
  const provider = ganache.provider(options);

  return {
    provider: provider,
    collector: collector
  }
}

module.exports = {
  pathPrefix: pathPrefix,
  filePath: filePath,
  report: report,
  instrumentAndCompile: instrumentAndCompile,
  bootstrapCoverage: bootstrapCoverage,
  initializeProvider: initializeProvider,

}
