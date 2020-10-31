const shell = require('shelljs');
const globby = require('globby');
const pluginUtils = require("./plugin.utils");
const path = require('path');
const util = require('util');
const {
  createProvider as createBuidlerProvider
} = require("@nomiclabs/buidler/internal/core/providers/construction");


// =============================
// Nomiclabs Plugin Utils
// =============================

/**
 * Returns a list of test files to pass to mocha.
 * @param  {String}   files   file or glob
 * @return {String[]}         list of files to pass to mocha
 */
function getTestFilePaths(files){
  const target = globby.sync([files])

  // Buidler/Hardhat supports js & ts
  const testregex = /.*\.(js|ts)$/;
  return target.filter(f => f.match(testregex) != null);
}

/**
 * Normalizes Buidler/Hardhat paths / logging for use by the plugin utilities and
 * attaches them to the config
 * @param  {Buidler/HardhatConfig} config
 * @return {Buidler/HardhatConfig}        updated config
 */
function normalizeConfig(config, args={}){
  config.workingDir = config.paths.root;
  config.contractsDir = config.paths.sources;
  config.testDir = config.paths.tests;
  config.artifactsDir = config.paths.artifacts;
  config.logger = config.logger ? config.logger : {log: null};
  config.solcoverjs = args.solcoverjs
  config.gasReporter = { enabled: false }

  return config;
}

function setupBuidlerNetwork(env, api, ui){
  let networkConfig = {};

  let networkName = (env.buidlerArguments.network !== 'buidlerevm')
    ? env.buidlerArguments.network
    : api.defaultNetworkName;

  if (networkName !== api.defaultNetworkName){
    networkConfig = env.config.networks[networkName];

    const configPort = networkConfig.url.split(':')[2];

    // Warn: port conflicts
    if (api.port !== api.defaultPort && api.port !== configPort){
      ui.report('port-clash', [ configPort ])
    }

    // Prefer network port
    api.port = parseInt(configPort);
  }

  networkConfig.url = `http://${api.host}:${api.port}`;
  networkConfig.gas =  api.gasLimit;
  networkConfig.gasPrice = api.gasPrice;

  const provider = createBuidlerProvider(networkName, networkConfig);

  env.config.networks[networkName] = networkConfig;
  env.config.defaultNetwork = networkName;

  env.network = {
    name: networkName,
    config: networkConfig,
    provider: provider,
  }

  env.ethereum = provider;

  // Return a reference so we can set the from account
  return env.network;
}

// TODO: Hardhat cacheing??
/**
 * Generates a path to a temporary compilation cache directory
 * @param  {BuidlerConfig} config
 * @return {String}        .../.coverage_cache
 */
function tempCacheDir(config){
  return path.join(config.paths.root, '.coverage_cache');
}

/**
 * Silently removes temporary folders and calls api.finish to shut server down
 * @param  {Buidler/HardhatConfig}     config
 * @param  {SolidityCoverage}  api
 * @return {Promise}
 */
async function finish(config, api){
  const {
    tempContractsDir,
    tempArtifactsDir
  } = pluginUtils.getTempLocations(config);

  shell.config.silent = true;
  shell.rm('-Rf', tempContractsDir);
  shell.rm('-Rf', tempArtifactsDir);
  shell.rm('-Rf', path.join(config.paths.root, '.coverage_cache'));
  shell.config.silent = false;

  if (api) await api.finish();
}

module.exports = {
  normalizeConfig: normalizeConfig,
  finish: finish,
  tempCacheDir: tempCacheDir,
  setupNetwork: setupNetwork,
  getTestFilePaths: getTestFilePaths
}

