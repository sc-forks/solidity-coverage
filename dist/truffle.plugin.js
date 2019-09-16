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
const TruffleProvider = require('@truffle/provider');

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
  let solcoverjs;
  let testsErrored = false;

  // Separate try block because this logic
  // runs before app.cleanUp is defined.
  try {
    ui = new PluginUI(truffleConfig.logger.log);

    if(truffleConfig.help) return ui.report('help'); // Exit if --help

    truffle = loadTruffleLibrary(ui, truffleConfig);
    app = new App(loadSolcoverJS(ui, truffleConfig));

  } catch (err) { throw err }

  try {
    // Catch interrupt signals
    death(app.cleanUp);

    setNetwork(ui, app, truffleConfig);

    // Provider / Server launch
    const address = await app.ganache(truffle.ganache);

    const web3 = new Web3(address);
    const accounts = await web3.eth.getAccounts();
    const nodeInfo = await web3.eth.getNodeInfo();
    const ganacheVersion = nodeInfo.split('/')[1];

    setNetworkFrom(truffleConfig, accounts);

    // Version Info
    ui.report('truffle-version', [truffle.version]);
    ui.report('ganache-version', [ganacheVersion]);
    ui.report('coverage-version',[pkg.version]);

    if (truffleConfig.version) return app.cleanUp(); // Exit if --version

    ui.report('network', [
      truffleConfig.network,
      truffleConfig.networks[truffleConfig.network].network_id,
      truffleConfig.networks[truffleConfig.network].port
    ]);

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
 * Configures the network. Runs before the server is launched.
 * User can request a network from truffle-config with "--network <name>".
 * There are overlapping options in solcoverjs (like port and providerOptions.network_id).
 * Where there are mismatches user is warned & the truffle network settings are preferred.
 *
 * Also generates a default config & sets the default gas high / gas price low.
 *
 * @param {SolidityCoverage}   app
 * @param {TruffleConfig}      config
 */
function setNetwork(ui, app, config){

  // --network <network-name>
  if (config.network){
    const network = config.networks[config.network];

    // Check network:
    if (!network){
      throw new Error(ui.generate('no-network', [config.network]));
    }

    // Check network id
    if (!isNaN(parseInt(network.network_id))){

      // Warn: non-matching provider options id and network id
      if (app.providerOptions.network_id &&
          app.providerOptions.network_id !== parseInt(network.network_id)){

        ui.report('id-clash', [ parseInt(network.network_id) ]);
      }

      // Prefer network defined id.
      app.providerOptions.network_id = parseInt(network.network_id);

    } else {
      network.network_id = "*";
    }

    // Check port: use solcoverjs || default if undefined
    if (!network.port) {
      ui.report('no-port', [app.port]);
      network.port = app.port;
    }

    // Warn: port conflicts
    if (app.port !== app.defaultPort && app.port !== network.port){
      ui.report('port-clash', [ network.port ])
    }

    // Prefer network port if defined;
    app.port = network.port;

    network.gas = app.gasLimit;
    network.gasPrice = app.gasPrice;

    setOuterConfigKeys(config, app, network.network_id);
    return;
  }

  // Default Network Configuration
  config.network = 'soliditycoverage';
  setOuterConfigKeys(config, app, "*");

  config.networks[config.network] = {
    network_id: "*",
    port: app.port,
    host: app.host,
    gas: app.gasLimit,
    gasPrice: app.gasPrice
  }
}

/**
 * Sets the default `from` account field in the truffle network that will be used.
 * This needs to be done after accounts are fetched from the launched client.
 * @param {TruffleConfig} config
 * @param {Array}         accounts
 */
function setNetworkFrom(config, accounts){
  if (!config.networks[config.network].from){
    config.networks[config.network].from = accounts[0];
  }
}

// Truffle complains that these outer keys *are not* set when running plugin fn directly.
// But throws saying they *cannot* be manually set when running as truffle command.
function setOuterConfigKeys(config, app, id){
  try {
    config.network_id = id;
    config.port = app.port;
    config.host = app.host;
    config.provider = TruffleProvider.create(config);
  } catch (err){}
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
    throw new Error(ui.generate('lib-fail', [err]));
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

  // Truffle writes to coverage config
  coverageConfig.log = truffleConfig.logger.log;
  coverageConfig.cwd = truffleConfig.working_directory;
  coverageConfig.originalContractsDir = truffleConfig.contracts_directory;

  // Solidity-Coverage writes to Truffle config
  truffleConfig.mocha = truffleConfig.mocha || {};

  if (coverageConfig.mocha && typeof coverageConfig.mocha === 'object'){
    truffleConfig.mocha = Object.assign(
      truffleConfig.mocha,
      coverageConfig.mocha
    );
  }

  return coverageConfig;
}


module.exports = plugin;
