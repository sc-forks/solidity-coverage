/**
 * Setup and reporting helpers for the suites which test instrumentation
 * and coverage correctness. (Integration test helpers are elsewhere)
 */
const fs = require('fs');
const path = require('path');
const solc = require('solc');
const ethers = require('ethers');

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
  const ethersProvider = new ethers.providers.Web3Provider(provider);
  const signer = ethersProvider.getSigner();
  const factory = new ethers.ContractFactory(
    getABI(info.solcOutput),
    getBytecode(info.solcOutput),
    signer
  )

  const contract = await factory.deploy();
  await contract.deployTransaction.wait();

  return contract;
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
    settings: {
      outputSelection: {'*': { '*': [ '*' ] }},
      evmVersion: "paris"
    }
  });
}

// ===========
// Diff tests
// ===========
function getDiffABIs(sourceName, testFile="test.sol", original="Old", current="New"){
  const contract = getCode(`${sourceName}.sol`)
  const solcOutput = compile(contract)
  return {
    original: {
      contractName: "Test",
      sha: "d8b26d8",
      abi: solcOutput.contracts[testFile][original].abi,
    },
    current: {
      contractName: "Test",
      sha: "e77e29d",
      abi: solcOutput.contracts[testFile][current].abi,
    }
  }
}

// ============================
// Instrumentation Correctness
// ============================
function instrumentAndCompile(sourceName, api={}) {
  const contract = getCode(`${sourceName}.sol`)
  const instrumenter = new Instrumenter(api.config);
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
async function bootstrapCoverage(file, api, provider){
  const info = instrumentAndCompile(file, api);

  // Need to define a gasLimit for contract calls because otherwise ethers will estimateGas
  // and cause duplicate hits for everything
  info.gas = { gasLimit: 2_000_000 }
  info.instance = await getDeployedContractInstance(info, provider);

  // Have to do this after the deployment call because provider initializes on send
  await api.attachToHardhatVM(provider);

  api.collector._setInstrumentationData(info.data);
  return info;
}


module.exports = {
  getCode,
  pathPrefix,
  filePath,
  report,
  instrumentAndCompile,
  bootstrapCoverage,
  getDiffABIs
}
