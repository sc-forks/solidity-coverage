const shell = require('shelljs');
const globby = require('globby');
const pluginUtils = require("./plugin.utils");
const path = require('path');
const util = require('util');
const { createProvider } = require("@nomiclabs/buidler/internal/core/providers/construction");


// =============================
// Buidler Plugin Utils
// =============================

/**
 * Normalizes buidler paths / logging for use by the plugin utilities and
 * attaches them to the config
 * @param  {BuidlerConfig} config
 * @return {BuidlerConfig}        updated config
 */
function normalizeConfig(config, args){
  config.workingDir = config.paths.root;
  config.contractsDir = config.paths.sources;
  config.testDir = config.paths.tests;
  config.artifactsDir = config.paths.artifacts;
  config.logger = config.logger ? config.logger : {log: null};
  config.solcoverjs = args.solcoverjs

  return config;
}

function setupNetwork(env, api, taskArgs={}, ui){
  let networkConfig = {};

  if (taskArgs.network){
    networkConfig = env.config.networks[taskArgs.network];

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

  const networkName = taskArgs.network || api.defaultNetworkName;
  const provider = createProvider(networkName, networkConfig);

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
  setupNetwork: setupNetwork
}

