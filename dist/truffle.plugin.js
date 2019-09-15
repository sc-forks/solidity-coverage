const App = require('./../lib/app');
const PluginUI = require('./plugin-assets/truffle.ui');

const pkg = require('./../package.json');
const req = require('req-cwd');
const death = require('death');
const path = require('path');
const dir = require('node-dir');
const Web3 = require('web3');
const util = require('util');
const globby = require('globby');
const shell = require('shelljs');
const globalModules = require('global-modules');

/**
 * Truffle Plugin: `truffle run coverage [options]`
 * @param  {Object}   truffleConfig   @truffle/config config
 * @return {Promise}
 */
async function plugin(truffleConfig){
  let ui;
  let app;
  let error;
  let truffle;
  let testsErrored = false;

  // This needs it's own try block because this logic
  // runs before app.cleanUp is defined.
  try {
    ui = new PluginUI(truffleConfig.logger.log);

    if(truffleConfig.help) return ui.report('help'); // Bail if --help

    truffle = loadTruffleLibrary(ui, truffleConfig);
    app = new App(loadSolcoverJS(ui, truffleConfig));

  } catch (err) { throw err }

  try {
    // Catch interrupt signals
    death(app.cleanUp);

    // Provider / Server launch
    const provider = await app.provider(truffle.ganache);
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    const nodeInfo = await web3.eth.getNodeInfo();
    const ganacheVersion = nodeInfo.split('/')[1];

    // Version Info
    ui.report('truffle-version', [truffle.version]);
    ui.report('ganache-version', [ganacheVersion]);
    ui.report('coverage-version',[pkg.version]);

    if (truffleConfig.version) return app.cleanUp(); // Bail if --version

    // Instrument
    app.sanityCheckContext();
    app.generateStandardEnvironment();
    app.instrument();

    // Filesystem & Compiler Re-configuration
    truffleConfig.contracts_directory = app.contractsDir;
    truffleConfig.build_directory = app.artifactsDir;

    truffleConfig.contracts_build_directory = path.join(
      app.artifactsDir,
      path.basename(truffleConfig.contracts_build_directory)
    );

    truffleConfig.all = true;
    truffleConfig.test_files = getTestFilePaths(ui, truffleConfig);
    truffleConfig.compilers.solc.settings.optimizer.enabled = false;

    // Compile Instrumented Contracts
    await truffle.contracts.compile(truffleConfig);

    // Network Re-configuration
    const networkName = 'soliditycoverage';
    truffleConfig.network = networkName;

    // Truffle complains that these keys *are not* set when running plugin fn directly.
    // But throws saying they *cannot* be manually set when running as truffle command.
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

/**
 * Returns a list of test files to pass to mocha.
 * @param  {Object}   ui      reporter utility
 * @param  {Object}   truffle truffleConfig
 * @return {String[]}         list of files to pass to mocha
 */
function getTestFilePaths(ui, truffle){
  let target;

  // Handle --file <path|glob> cli option (subset of tests)
  (typeof truffle.file === 'string')
    ? target = globby.sync([truffle.file])
    : target = dir.files(truffle.test_directory, { sync: true }) || [];

  // Filter native solidity tests and warn that they're skipped
  const solregex = /.*\.(sol)$/;
  const hasSols = target.filter(f => f.match(solregex) != null);

  if (hasSols.length > 0) ui.report('sol-tests', [hasSols.length]);

  // Return list of test files
  const testregex = /.*\.(js|ts|es|es6|jsx)$/;
  return target.filter(f => f.match(testregex) != null);
}



/**
 * Tries to load truffle module library and reports source. User can force use of
 * a non-local version using cli flags (see option). Load order is:
 *
 * 1. local node_modules
 * 2. global node_modules
 * 3. fail-safe (truffle lib v 5.0.31 at ./plugin-assets/truffle.library)
 *
 * @param  {Object} ui            reporter utility
 * @param  {Object} truffleConfig config
 * @return {Module}
 */
function loadTruffleLibrary(ui, truffleConfig){

  // Local
  try {
    if (truffleConfig.useGlobalTruffle || truffleConfig.usePluginTruffle) throw null;

    const lib = require("truffle");
    ui.report('lib-local');
    return lib;

  } catch(err) {};

  // Global
  try {
    if (truffleConfig.usePluginTruffle) throw null;

    const globalTruffle = path.join(globalModules, 'truffle');
    const lib = require(globalTruffle);
    ui.report('lib-global');
    return lib;

  } catch(err) {};

  // Plugin Copy @ v 5.0.31
  try {
    if (truffleConfig.forceLibFailure) throw null; // For err unit testing

    ui.report('lib-warn');
    return require("./plugin-assets/truffle.library")

  } catch(err) {
    const msg = ui.generate('lib-fail', [err]);
    throw new Error(msg);
  };

}

function loadSolcoverJS(ui, truffleConfig){
  let coverageConfig;
  let solcoverjs;

  // Handle --solcoverjs flag
  (truffleConfig.solcoverjs)
    ? solcoverjs = path.join(truffleConfig.working_directory, truffleConfig.solcoverjs)
    : solcoverjs = path.join(truffleConfig.working_directory, '.solcover.js');

  // Catch solcoverjs syntax errors
  if (shell.test('-e', solcoverjs)){

    try {
      coverageConfig = require(solcoverjs);
    } catch(error){
      error.message = ui.generate('solcoverjs-fail') + error.message;
      throw new Error(error)
    }

  // Config is optional
  } else {
    coverageConfig = {};
  }

  coverageConfig.log = truffleConfig.logger.log;
  coverageConfig.cwd = truffleConfig.working_directory;
  coverageConfig.originalContractsDir = truffleConfig.contracts_directory;

  return coverageConfig;
}


module.exports = plugin;
