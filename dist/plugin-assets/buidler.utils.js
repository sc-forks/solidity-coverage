const shell = require('shelljs');
const globby = require('globby');
const pluginUtils = require("./plugin.utils");
const path = require('path');
const util = require('util');
const { createProvider } = require("@nomiclabs/buidler/internal/core/providers/construction");


// =============================
// Buidler Specific Plugin Utils
// =============================

/**
 * Returns a list of test files to pass to TASK_TEST.
 * @param  {BuidlerConfig}    config
 * @return {String[]}         list of files to pass to mocha
 */
function getTestFilePaths(config){
  let target;

  // Handle --file <path|glob> cli option (subset of tests)
  (typeof config.file === 'string')
    ? target = globby.sync([config.file])
    : target = [];

  // Return list of test files
  const testregex = /.*\.(js|ts|es|es6|jsx)$/;
  return target.filter(f => f.match(testregex) != null);
}

/**
 * Normalizes buidler paths / logging for use by the plugin utilities and
 * attaches them to the config
 * @param  {BuidlerConfig} config
 * @return {BuidlerConfig}        updated config
 */
function normalizeConfig(config){
  config.workingDir = config.paths.root;
  config.contractsDir = config.paths.sources;
  config.testDir = config.paths.tests;
  config.artifactsDir = config.paths.artifacts;
  config.logger = config.logger ? config.logger : {log: null};

  return config;
}

function setupNetwork(env, api){
  const networkConfig = {
    url: `http://${api.host}:${api.port}`,
    gas: api.gasLimit,
    gasPrice: api.gasPrice
  }

  const provider = createProvider(api.defaultNetworkName, networkConfig);

  env.config.networks[api.defaultNetworkName] = networkConfig;
  env.config.defaultNetwork = api.defaultNetworkName;

  env.network = {
    name: api.defaultNetworkName,
    config: networkConfig,
    provider: provider,
  }

  env.ethereum = provider;

  // Return a reference so we can set the from account
  return env.network;
}

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
 * @param  {BuidlerConfig}     config
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
  getTestFilePaths: getTestFilePaths,
  setupNetwork: setupNetwork
}

