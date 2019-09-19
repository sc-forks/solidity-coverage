const API = require('./../lib/api');
const PluginUI = require('./plugin-assets/truffle.ui');

const pkg = require('./../package.json');
const req = require('req-cwd');
const death = require('death');
const path = require('path');
const fs = require('fs-extra');
const dir = require('node-dir');
const Web3 = require('web3');
const util = require('util');
const globby = require('globby');
const shell = require('shelljs');
const globalModules = require('global-modules');
const TruffleProvider = require('@truffle/provider');

/**
 * Truffle Plugin: `truffle run coverage [options]`
 * @param  {Object}   config   @truffle/config config
 * @return {Promise}
 */
async function plugin(config){
  let ui;
  let api;
  let error;
  let truffle;
  let testsErrored = false;

  try {
    death(finish.bind(null, config, api)); // Catch interrupt signals

    ui = new PluginUI(config.logger.log);

    if(config.help) return ui.report('help'); // Exit if --help

    truffle = loadTruffleLibrary(config);
    api = new API(loadSolcoverJS(config));

    setNetwork(config, api);

    // Server launch
    const address = await api.ganache(truffle.ganache);

    const web3 = new Web3(address);
    const accounts = await web3.eth.getAccounts();
    const nodeInfo = await web3.eth.getNodeInfo();
    const ganacheVersion = nodeInfo.split('/')[1];

    setNetworkFrom(config, accounts);

    // Version Info
    ui.report('versions', [
      truffle.version,
      ganacheVersion,
      pkg.version
    ]);

    // Exit if --version
    if (config.version) return await finish(config, api);

    ui.report('network', [
      config.network,
      config.networks[config.network].network_id,
      config.networks[config.network].port
    ]);

    // Instrument
    let {
      targets,
      skipped
    } = assembleFiles(config, api.skipFiles);

    targets = api.instrument(targets);
    reportSkipped(config, skipped);

    // Filesystem & Compiler Re-configuration
    const {
      tempArtifactsDir,
      tempContractsDir
    } = getTempLocations(config);

    save(targets, config.contracts_directory, tempContractsDir);
    save(skipped, config.contracts_directory, tempContractsDir);

    config.contracts_directory = tempContractsDir;
    config.build_directory = tempArtifactsDir;

    config.contracts_build_directory = path.join(
      tempArtifactsDir,
      path.basename(config.contracts_build_directory)
    );

    config.all = true;
    config.test_files = getTestFilePaths(config);
    config.compilers.solc.settings.optimizer.enabled = false;

    // Compile Instrumented Contracts
    await truffle.contracts.compile(config);

    // Run tests
    try {
      failures = await truffle.test.run(config)
    } catch (e) {
      error = e.stack;
    }
    // Run Istanbul
    await api.report();

  } catch(e){
    error = e;
  }


  // Finish
  await finish(config, api);

  if (error !== undefined) throw error;
  if (failures > 0) throw new Error(`${failures} test(s) failed under coverage.`)
}

// -------------------------------------- Helpers --------------------------------------------------

async function finish(config, api){
  const {
    tempContractsDir,
    tempArtifactsDir
  } = getTempLocations(config);

  shell.config.silent = true;
  shell.rm('-Rf', tempContractsDir);
  shell.rm('-Rf', tempArtifactsDir);

  if (api) await api.finish();
}

function reportSkipped(config, skipped=[]){
  let started = false;
  const ui = new PluginUI(config.logger.log);

  for (let item of skipped){
    if (!started) {
      ui.report('instr-skip', []);
      started = true;
    }
    ui.report('instr-skipped', [item.relativePath]);
  }
}

// ========
  // File I/O
  // ========
function loadSource(_path){
  return fs.readFileSync(_path).toString();
}

function save(targets, originalDir, targetDir){
  let _path;
  for (target of targets) {
    _path = target.canonicalPath.replace(originalDir, targetDir);
    fs.outputFileSync(_path, target.source);
  }
}

function assembleFiles(config, skipFiles=[]){
  let targets;
  let skipFolders;
  let skipped = [];

  const {
    tempContractsDir,
    tempArtifactsDir
  } = getTempLocations(config);

  sanityCheckContext(config, tempContractsDir, tempArtifactsDir);

  shell.mkdir(tempContractsDir);
  shell.mkdir(tempArtifactsDir);

  targets = shell.ls(`${config.contracts_directory}/**/*.sol`);

  skipFiles = assembleSkipped(config, targets, skipFiles);

  return assembleTargets(config, targets, skipFiles)
}


function getTempLocations(config){
  const cwd = config.working_directory;
  const contractsDirName = '.coverage_contracts';
  const artifactsDirName = '.coverage_artifacts';

  return {
    tempContractsDir: path.join(cwd, contractsDirName),
    tempArtifactsDir: path.join(cwd, artifactsDirName)
  }
}


function assembleTargets(config, targets=[], skipFiles=[]){
  const skipped = [];
  const filtered = [];
  const cd = config.contracts_directory;

  for (let target of targets){
    if (skipFiles.includes(target)){

      skipped.push({
        canonicalPath: target,
        relativePath: toRelativePath(target, cd),
        source: loadSource(target)
      })

    } else {

      filtered.push({
        canonicalPath: target,
        relativePath: toRelativePath(target, cd),
        source: loadSource(target)
      })
    }
  }

  return {
    skipped: skipped,
    targets: filtered
  }
}

/**
 * Parses the skipFiles option (which also accepts folders)
 */
function assembleSkipped(config, targets, skipFiles=[]){
  const cd = config.contracts_directory;

  // Make paths absolute
  skipFiles = skipFiles.map(contract => `${cd}/${contract}`);
  skipFiles.push(`${cd}/Migrations.sol`);

  // Enumerate files in skipped folders
  const skipFolders = skipFiles.filter(item => path.extname(item) !== '.sol')

  for (let folder of skipFolders){
    for (let target of targets ) {
      if (target.indexOf(folder) === 0)
        skipFiles.push(target);
     }
  };

  return skipFiles;
}

/**
 * Checks for existence of contract sources, and sweeps away debris
 * left over from an uncontrolled crash.
 */
function sanityCheckContext(config, tempContractsDir, tempArtifactsDir){
  const ui = new PluginUI(config.logger.log);

  if (!shell.test('-e', config.contracts_directory)){

    const msg = ui.generate('sources-fail', [config.contracts_directory])
    throw new Error(msg);
  }

  if (shell.test('-e', tempContractsDir)){
    shell.rm('-Rf', tempContractsDir);
  }

  if (shell.test('-e', tempArtifactsDir)){
    shell.rm('-Rf', tempArtifactsDir);
  }
}

function toRelativePath(pathToFile, pathToParent){
  return pathToFile.replace(`${pathToParent}${path.sep}`, '');
}

/**
 * Returns a list of test files to pass to mocha.
 * @param  {Object}   config  truffleConfig
 * @return {String[]}         list of files to pass to mocha
 */
function getTestFilePaths(config){
  let target;
  let ui = new PluginUI(config.logger.log);


  // Handle --file <path|glob> cli option (subset of tests)
  (typeof config.file === 'string')
    ? target = globby.sync([config.file])
    : target = dir.files(config.test_directory, { sync: true }) || [];

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
 * There are overlapiing options in solcoverjs (like port and providerOptions.network_id).
 * Where there are mismatches user is warned & the truffle network settings are preferred.
 *
 * Also generates a default config & sets the default gas high / gas price low.
 *
 * @param {TruffleConfig}      config
 * @param {SolidityCoverage} api
 */
function setNetwork(config, api){
  const ui = new PluginUI(config.logger.log);

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
      if (api.providerOptions.network_id &&
          api.providerOptions.network_id !== parseInt(network.network_id)){

        ui.report('id-clash', [ parseInt(network.network_id) ]);
      }

      // Prefer network defined id.
      api.providerOptions.network_id = parseInt(network.network_id);

    } else {
      network.network_id = "*";
    }

    // Check port: use solcoverjs || default if undefined
    if (!network.port) {
      ui.report('no-port', [api.port]);
      network.port = api.port;
    }

    // Warn: port conflicts
    if (api.port !== api.defaultPort && api.port !== network.port){
      ui.report('port-clash', [ network.port ])
    }

    // Prefer network port if defined;
    api.port = network.port;

    network.gas = api.gasLimit;
    network.gasPrice = api.gasPrice;

    setOuterConfigKeys(config, api, network.network_id);
    return;
  }

  // Default Network Configuration
  config.network = 'soliditycoverage';
  setOuterConfigKeys(config, api, "*");

  config.networks[config.network] = {
    network_id: "*",
    port: api.port,
    host: api.host,
    gas: api.gasLimit,
    gasPrice: api.gasPrice
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
function setOuterConfigKeys(config, api, id){
  try {
    config.network_id = id;
    config.port = api.port;
    config.host = api.host;
    config.provider = TruffleProvider.create(config);
  } catch (err){}
}

/**
 * Tries to load truffle module library and reports source. User can force use of
 * a non-local version using cli flags (see option). It's necessary to maintain
 * a fail-safe lib because feature was only introduced in 5.0.30. Load order is:
 *
 * 1. local node_modules
 * 2. global node_modules
 * 3. fail-safe (truffle lib v 5.0.31 at ./plugin-assets/truffle.library)
 *
 * @param  {Object} truffleConfig config
 * @return {Module}
 */
function loadTruffleLibrary(config){
  const ui = new PluginUI(config.logger.log);

  // Local
  try {
    if (config.useGlobalTruffle || config.usePluginTruffle) throw null;

    const lib = require("truffle");
    ui.report('lib-local');
    return lib;

  } catch(err) {};

  // Global
  try {
    if (config.usePluginTruffle) throw null;

    const globalTruffle = path.join(globalModules, 'truffle');
    const lib = require(globalTruffle);
    ui.report('lib-global');
    return lib;

  } catch(err) {};

  // Plugin Copy @ v 5.0.31
  try {
    if (config.forceLibFailure) throw null; // For err unit testing

    ui.report('lib-warn');
    return require("./plugin-assets/truffle.library")

  } catch(err) {
    throw new Error(ui.generate('lib-fail', [err]));
  };

}

function loadSolcoverJS(config){
  let solcoverjs;
  let coverageConfig;
  let ui = new PluginUI(config.logger.log);


  // Handle --solcoverjs flag
  (config.solcoverjs)
    ? solcoverjs = path.join(config.working_directory, config.solcoverjs)
    : solcoverjs = path.join(config.working_directory, '.solcover.js');

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
  coverageConfig.log = config.logger.log;
  coverageConfig.cwd = config.working_directory;
  coverageConfig.originalContractsDir = config.contracts_directory;

  // Solidity-Coverage writes to Truffle config
  config.mocha = config.mocha || {};

  if (coverageConfig.mocha && typeof coverageConfig.mocha === 'object'){
    config.mocha = Object.assign(
      config.mocha,
      coverageConfig.mocha
    );
  }

  return coverageConfig;
}

module.exports = plugin;
