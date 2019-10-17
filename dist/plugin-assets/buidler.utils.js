const shell = require('shelljs');
const pluginUtils = require("./plugin.utils");
const path = require('path')
const util = require('util')

function normalizeConfig(config){
  config.workingDir = config.paths.root;
  config.contractsDir = config.paths.sources;
  config.testDir = config.paths.tests;
  config.artifactsDir = config.paths.artifacts;

  return config;
}

function tempCacheDir(config){
  return path.join(config.paths.root, '.coverage_cache');
}

/**
 * Silently removes temporary folders and calls api.finish to shut server down
 * @param  {buidlerConfig}     config
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
  tempCacheDir: tempCacheDir
}

