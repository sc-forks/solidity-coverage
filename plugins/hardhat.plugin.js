const API = require('./../lib/api');
const utils = require('./resources/plugin.utils');
const nomiclabsUtils = require('./resources/nomiclabs.utils');
const PluginUI = require('./resources/nomiclabs.ui');

const pkg = require('./../package.json');
const death = require('death');
const path = require('path');

const { task, types } = require("hardhat/config");
const { HardhatPluginError } = require("hardhat/plugins")

const {
  TASK_TEST,
  TASK_COMPILE,
  TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
  TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
} = require("hardhat/builtin-tasks/task-names");

// Toggled true for `coverage` task only.
let measureCoverage = false;
let instrumentedSources

task(TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT).setAction(async (_, { config }, runSuper) => {
  const solcInput = await runSuper();
  if (measureCoverage) {
    // The source name here is actually the global name in the solc input,
    // but hardhat uses the fully qualified contract names.
    for (const [sourceName, source] of Object.entries(solcInput.sources)) {
      const absolutePath = path.join(config.paths.root, sourceName);
      // Patch in the instrumented source code.
      if (absolutePath in instrumentedSources) {
        source.content = instrumentedSources[absolutePath];
      }
    }
  }
  return solcInput;
});

// Solidity settings are best set here instead of the TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT task.
task(TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE).setAction(async (_, __, runSuper) => {
  const compilationJob = await runSuper();
  if (measureCoverage && typeof compilationJob === "object") {
    if (compilationJob.solidityConfig.settings === undefined) {
      compilationJob.solidityConfig.settings = {};
    }

    const { settings } = compilationJob.solidityConfig;
    if (settings.metadata === undefined) {
      settings.metadata = {};
    }
    if (settings.optimizer === undefined) {
      settings.optimizer = {};
    }
    // Unset useLiteralContent due to solc metadata size restriction
    settings.metadata.useLiteralContent = false;
    // Override optimizer settings for all compilers
    settings.optimizer.enabled = false;
  }
  return compilationJob;
});

/**
 * Coverage task implementation
 * @param  {HardhatUserArgs} args
 * @param  {HardhatEvn} env
 */
async function plugin(args, env) {
  let error;
  let ui;
  let api;
  let config;
  let client;
  let address;
  let web3;
  let failedTests = 0;

  instrumentedSources = {};
  measureCoverage = true;

  try {
    death(nomiclabsUtils.finish.bind(null, config, api)); // Catch interrupt signals

    config = nomiclabsUtils.normalizeConfig(env.config, args);
    ui = new PluginUI(config.logger.log);
    api = new API(utils.loadSolcoverJS(config));

    // Version Info
    ui.report('hardhat-versions', [pkg.version]);

    // Merge non-null flags into hardhatArguments
    const flags = {};
    for (const key of Object.keys(args)){
      if (args[key] && args[key].length){
        flags[key] = args[key]
      }
    }
    env.hardhatArguments = Object.assign(env.hardhatArguments, flags)

    // ================
    // Instrumentation
    // ================

    const skipFiles = api.skipFiles || [];

    let {
      targets,
      skipped
    } = utils.assembleFiles(config, skipFiles);

    targets = api.instrument(targets);
    for (const target of targets) {
      instrumentedSources[target.canonicalPath] = target.source;
    }
    utils.reportSkipped(config, skipped);

    // ==============
    // Compilation
    // ==============
    config.temp = args.temp;

    const {
      tempArtifactsDir,
      tempContractsDir
    } = utils.getTempLocations(config);

    utils.setupTempFolders(config, tempContractsDir, tempArtifactsDir)

    config.paths.artifacts = tempArtifactsDir;
    config.paths.cache = nomiclabsUtils.tempCacheDir(config);

    measureCoverage = true;
    await env.run(TASK_COMPILE);

    await api.onCompileComplete(config);

    // ==============
    // Server launch
    // ==============
    const network = nomiclabsUtils.setupHardhatNetwork(env, api, ui);

    if (network.isHardhatEVM){
      accounts = await nomiclabsUtils.getAccounts(network.provider);
      nodeInfo = await nomiclabsUtils.getNodeInfo(network.provider);

      ui.report('hardhat-network', [
        nodeInfo.split('/')[1],
        env.network.name,
      ]);
    } else {
      const Web3 = require('Web3');
      client = api.client || require('ganache-cli');
      address = await api.ganache(client);
      web3 = new Web3(address);
      accounts = await web3.eth.getAccounts();
      nodeInfo = await web3.eth.getNodeInfo();

      ui.report('ganache-network', [
        nodeInfo.split('/')[1],
        env.network.name,
        api.port
      ]);
    }

    // Set default account
    network.from = accounts[0];

    // Run post-launch server hook;
    await api.onServerReady(config);

    // ======
    // Tests
    // ======
    const testfiles = args.testfiles
      ? nomiclabsUtils.getTestFilePaths(args.testfiles)
      : [];

    try {
      failedTests = await env.run(TASK_TEST, {testFiles: testfiles})
    } catch (e) {
      error = e;
    }
    await api.onTestsComplete(config);

    // ========
    // Istanbul
    // ========
    await api.report();
    await api.onIstanbulComplete(config);

  } catch(e) {
    error = e;
  } finally {
    measureCoverage = false;
  }

  await nomiclabsUtils.finish(config, api);

  if (error !== undefined ) throw new HardhatPluginError(error);
  if (failedTests > 0) throw new HardhatPluginError(ui.generate('tests-fail', [failedTests]));
}

module.exports = plugin;
