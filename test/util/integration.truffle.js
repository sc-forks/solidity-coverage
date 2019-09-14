
/*
  Utilities for generating a mock truffle project to test plugin.
*/

const path = require('path');
const fs = require('fs');
const shell = require('shelljs');
const TruffleConfig = require('truffle-config');
const decache = require('decache');

const temp =              './sc_temp';
const truffleConfigName = 'truffle-config.js';
const configPath =        `${temp}/.solcover.js`;
const testPath =          './test/sources/js/';
const sourcesPath =       './test/sources/solidity/contracts/app/';
const migrationPath =     `${temp}/migrations/2_deploy.js`;
const templatePath =      './test/integration/truffle/*';
const projectPath =       './test/integration/projects/'


// ==========================
// Misc Utils
// ==========================
function decacheConfigs(){
  decache(`${process.cwd()}/${temp}/.solcover.js`);
  decache(`${process.cwd()}/${temp}/${truffleConfigName}`);
}

function clean() {
  shell.config.silent = true;

  shell.rm('-Rf', temp);
  shell.rm('-Rf', 'coverage');
  shell.rm('coverage.json');
  shell.rm('.solcover.js');

  shell.config.silent = false;
};

// ==========================
// Configuration
// ==========================
function getDefaultTruffleConfig(){
  const logger = process.env.SILENT ? { log: () => {} } : console;
  const reporter = process.env.SILENT ? 'dot' : 'spec';

  const mockwd = path.join(process.cwd(), temp);
  const vals = {
    working_directory: mockwd,
    build_directory:  path.join(mockwd, 'build'),
    contracts_directory: path.join(mockwd, 'contracts'),
    contracts_build_directory: path.join(mockwd, 'build', 'contracts'),
    migrations_directory: path.join(mockwd, 'migrations'),
    test_directory: path.join(mockwd, 'test'),
    logger: logger,
    mocha: { reporter: reporter },
    networks: {
      development: {
        host: "localhost",
        port: 8545,
        network_id: "*"
      }
    },
    compilers: {
      solc: {
        version: "0.5.3",
        settings: { optimizer: {} }
      }
    }
  }

  return (new TruffleConfig()).with(vals);
}

function getSolcoverJS(config){
  return `module.exports = ${JSON.stringify(config, null, ' ')}`
}

function getTruffleConfigJS(config){
  if (config) return `module.exports = ${JSON.stringify(config, null, ' ')}`
  return `module.exports = ${JSON.stringify(getDefaultTruffleConfig(), null, ' ')}`
}

// ==========================
// Migration Generators
// ==========================
function deploySingle(contractName){
  return `
    const A = artifacts.require("${contractName}");
    module.exports = function(deployer) { deployer.deploy(A) };
  `;
}

function deployDouble(contractNames){
  return `
    var A = artifacts.require("${contractNames[0]}");
    var B = artifacts.require("${contractNames[1]}");
    module.exports = function(deployer) {
      deployer.deploy(A);
      deployer.link(A, B);
      deployer.deploy(B);
    };
  `;
}

// ==========================
// Project Installers
// ==========================
/**
 * Installs mock truffle project at ./temp with a single contract
 * and test specified by the params.
 * @param  {String} contract <contractName.sol> located in /test/sources/cli/
 * @param  {[type]} test     <testName.js> located in /test/cli/
 */
function install(
  contract,
  test,
  config,
  _truffleConfig,
  noMigrations
) {

  let configjs;
  if(config) configjs = getSolcoverJS(config);

  const trufflejs = getTruffleConfigJS(_truffleConfig);
  const migration = deploySingle(contract);

  // Scaffold
  shell.mkdir(temp);
  shell.cp('-Rf', templatePath, temp);

  // Contract
  shell.cp(`${sourcesPath}${contract}.sol`, `${temp}/contracts/${contract}.sol`);

  // Migration
  if (!noMigrations) fs.writeFileSync(migrationPath, migration);

  // Test
  shell.cp(`${testPath}${test}`, `${temp}/test/${test}`);

  // Configs
  fs.writeFileSync(`${temp}/${truffleConfigName}`, trufflejs);
  if(config) fs.writeFileSync(configPath, configjs);

  decacheConfigs();

};

/**
 * Installs mock truffle project with two contracts (for inheritance, libraries, etc)
 *
 */
function installDouble(contracts, test, config) {
  const configjs = getSolcoverJS(config);
  const migration = deployDouble(contracts);

  // Scaffold
  shell.mkdir(temp);
  shell.cp('-Rf', templatePath, temp);

  // Contracts
  contracts.forEach(item => {
    shell.cp(`${sourcesPath}${item}.sol`, `${temp}/contracts/${item}.sol`)
  });

  // Migration
  fs.writeFileSync(migrationPath, migration)

  // Test
  shell.cp(`${testPath}${test}`, `${temp}/test/${test}`);

  // Configs
  fs.writeFileSync(`${temp}/${truffleConfigName}`, getTruffleConfigJS());
  fs.writeFileSync(configPath, configjs);

  decacheConfigs();
};

function installFullProject(name) {
  shell.mkdir(temp);
  shell.cp('-Rf', `${projectPath}${name}/{.,}*`, temp);

  decacheConfigs();
}

// ==========================
// Logging
// ==========================
const loggerOutput = {
  val: ''
};

const testLogger = {
  log: (val) => {
    if (val !== undefined) loggerOutput.val += val;
    if (!process.env.SILENT && val !== undefined)
       console.log(val)
  }
}


module.exports = {
  testLogger: testLogger,
  loggerOutput: loggerOutput,
  getDefaultTruffleConfig: getDefaultTruffleConfig,
  install: install,
  installDouble: installDouble,
  installFullProject: installFullProject,
  clean: clean
}

