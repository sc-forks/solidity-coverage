/*
  TruffleConfig Paths
  ===========================
  build_directory            /users/myPath/to/someProject/build
  contracts_directory.       /users/myPath/to/someProject/contracts
  working_directory          /users/myPath/to/someProject
  contracts_build_directory  /users/myPath/to/someProject/build/contracts

  Compilation options override
  ----------------------------
  build_directory            /users/myPath/to/someProject/.coverageArtifacts
  contracts_directory        /users/myPath/to/someProject/.coverageContracts

  Test options override
  ---------------------
  contracts_directory,       /users/myPath/to/someProject/.coverageContracts
  contracts_build_directory, /users/myPath/to/someProject/.coverageArtifacts/contracts
  provider                   ganache.provider (async b/c vm must be resolved)
  logger                     add filter for unused variables...

  Truffle Lib API
  ===============
  load:         const truffle = require("truffle") (or require("sc-truffle"))
  compilation:  await truffle.contracts.compile(config)
  test:         await truffle.test.run(config)
*/

const App = require('./../lib/app');
const pkg = require('./../package.json');
const req = require('req-cwd');
const death = require('death');
const path = require('path');
const dir = require('node-dir');
const Web3 = require('web3');
const util = require('util');
const globby = require('globby');
const globalModules = require('global-modules');

async function plugin(truffleConfig){
  let app;
  let error;
  let truffle;
  let testsErrored = false;
  let coverageConfig;
  let solcoverjs;

  // Load truffle lib, .solcover.js & launch app
  try {
    (truffleConfig.solcoverjs)
      ? solcoverjs = path.join(truffleConfig.working_directory, truffleConfig.solcoverjs)
      : solcoverjs = path.join(truffleConfig.working_directory, '.solcover.js');

    coverageConfig = req.silent(solcoverjs) || {};
    coverageConfig.cwd = truffleConfig.working_directory;
    coverageConfig.originalContractsDir = truffleConfig.contracts_directory;
    coverageConfig.log = coverageConfig.log || truffleConfig.logger.log;

    app = new App(coverageConfig);

    if (truffleConfig.help){
      return app.ui.report('truffle-help')
    }

    truffle = loadTruffleLibrary(app);

  } catch (err) {
    throw err;
  }

  // Instrument and test..
  try {
    death(app.cleanUp); // This doesn't work...

    // Launch in-process provider
    const provider = await app.provider(truffle.ganache);
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    const nodeInfo = await web3.eth.getNodeInfo();
    const ganacheVersion = nodeInfo.split('/')[1];

    app.ui.report('truffle-version', [truffle.version]);
    app.ui.report('ganache-version', [ganacheVersion]);
    app.ui.report('coverage-version',[pkg.version]);

    // Bail early if user ran: --version
    if (truffleConfig.version) return;

    // Write instrumented sources to temp folder
    app.instrument();

    // Ask truffle to use temp folders
    truffleConfig.contracts_directory = app.contractsDir;
    truffleConfig.build_directory = app.artifactsDir;
    truffleConfig.contracts_build_directory = paths.artifacts(truffleConfig, app);

    // Additional config
    truffleConfig.all = true;
    truffleConfig.test_files = tests(app, truffleConfig);
    truffleConfig.compilers.solc.settings.optimizer.enabled = false;

    // Compile
    await truffle.contracts.compile(truffleConfig);

    // Launch in-process provider
    const networkName = 'soliditycoverage';
    truffleConfig.network = networkName;

    // Truffle alternately complains that fields are and
    // are not manually set
    try {
      truffleConfig.network_id = "*";
      truffleConfig.provider = provider;
    } catch (err){}

    truffleConfig.networks[networkName] = {
      network_id: "*",
      provider: provider,
      gas: app.gasLimit,
      gasPrice: app.gasPrice,
      from: accounts[0]
    }

    // Run tests
    try {
      failures = await truffle.test.run(truffleConfig)
    } catch (e) {
      error = e.stack;
    }
    // Run Istanbul
    await app.report();

  } catch(e){
    error = e;
  }

  // Finish
  await app.cleanUp();

  if (error !== undefined) throw error;
  if (failures > 0) throw new Error(`${failures} test(s) failed under coverage.`)
}

// -------------------------------------- Helpers --------------------------------------------------

function tests(app, truffle){
  let target;

  (typeof truffle.file === 'string')
    ? target = globby.sync([truffle.file])
    : target = dir.files(truffle.test_directory, { sync: true }) || [];

  const solregex = /.*\.(sol)$/;
  const hasSols = target.filter(f => f.match(solregex) != null);

  if (hasSols.length > 0) app.ui.report('sol-tests', [hasSols.length]);

  const testregex = /.*\.(js|ts|es|es6|jsx)$/;
  return target.filter(f => f.match(testregex) != null);
}


function loadTruffleLibrary(app){

  // Case: from local node_modules
  try {
    const lib = require("truffle");
    app.ui.report('truffle-local');
    return lib;

  } catch(err) {};

  // Case: global
  try {
    const globalTruffle = path.join(globalModules, 'truffle');
    const lib = require(globalTruffle);
    app.ui.report('truffle-global');
    return lib;

  } catch(err) {};

  // Default: fallback
  try {

    app.ui.report('truffle-warn');
    return require("./truffle.library")}

  catch(err) {
    const msg = app.ui.generate('truffle-fail', [err]);
    throw new Error(msg);
  };

}

/**
 * Functions to generate substitute paths for instrumented contracts and artifacts.
 * @type {Object}
 */
const paths = {

  // "contracts_build_directory":
  artifacts: (truffle, app) => {
    return path.join(
      app.artifactsDir,
      path.basename(truffle.contracts_build_directory)
    )
  }
}

module.exports = plugin;
