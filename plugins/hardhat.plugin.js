const API = require('./../lib/api');
const utils = require('./resources/plugin.utils');
const nomiclabsUtils = require('./resources/nomiclabs.utils');
const PluginUI = require('./resources/nomiclabs.ui');

const pkg = require('./../package.json');
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
let configureYulOptimizer = false;
let instrumentedSources

// UI for the task flags...
const ui = new PluginUI();

subtask(TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT).setAction(async (_, { config }, runSuper) => {
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
subtask(TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE).setAction(async (_, __, runSuper) => {
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

    // This is fixes a stack too deep bug in ABIEncoderV2
    // Experimental because not sure this works as expected across versions....
    if (configureYulOptimizer) {
      settings.optimizer.details = {
        yul: true,
        yulDetails: {
          stackAllocation: true,
        },
      }
    }
  }
  return compilationJob;
});

/**
 * Coverage task implementation
 * @param  {HardhatUserArgs} args
 * @param  {HardhatEnv} env
 */
task("coverage", "Generates a code coverage report for tests")
  .addOptionalParam("testfiles",  ui.flags.file,       "", types.string)
  .addOptionalParam("solcoverjs", ui.flags.solcoverjs, "", types.string)
  .addOptionalParam('temp',       ui.flags.temp,       "", types.string)
  .setAction(async function(args, env){

  let error;
  let ui;
  let api;
  let config;
  let client;
  let address;
  let failedTests = 0;

  instrumentedSources = {};
  measureCoverage = true;

  try {
    config = nomiclabsUtils.normalizeConfig(env.config, args);
    ui = new PluginUI(config.logger.log);
    api = new API(utils.loadSolcoverJS(config));

    // Catch interrupt signals
    process.on("SIGINT", nomiclabsUtils.finish.bind(null, config, api, true));

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
    ui.report('compilation', []);

    config.temp = args.temp;
    configureYulOptimizer = api.config.configureYulOptimizer;

    // With Hardhat >= 2.0.4, everything should automatically recompile
    // after solidity-coverage corrupts the artifacts.
    // Prior to that version, we (try to) save artifacts to a temp folder.
    if (!config.useHardhatDefaultPaths){
      const {
        tempArtifactsDir,
        tempContractsDir
      } = utils.getTempLocations(config);

      utils.setupTempFolders(config, tempContractsDir, tempArtifactsDir)
      config.paths.artifacts = tempArtifactsDir;
      config.paths.cache = nomiclabsUtils.tempCacheDir(config);
    }

    await env.run(TASK_COMPILE);

    await api.onCompileComplete(config);

    // ==============
    // Server launch
    // ==============
    const network = nomiclabsUtils.setupHardhatNetwork(env, api, ui);

    if (network.isHardhatEVM){
      accounts = await utils.getAccountsHardhat(network.provider);
      nodeInfo = await utils.getNodeInfoHardhat(network.provider);

      api.attachToHardhatVM(network.provider);

      ui.report('hardhat-network', [
        nodeInfo.split('/')[1],
        env.network.name,
      ]);
    } else {
      client = api.client || require('ganache-cli');
      address = await api.ganache(client);
      const accountsRequest = await utils.getAccountsGanache(api.server.provider);
      const nodeInfoRequest = await utils.getNodeInfoGanache(api.server.provider);

      ui.report('ganache-network', [
        nodeInfoRequest.result.split('/')[1],
        env.network.name,
        api.port
      ]);

      accounts = accountsRequest.result;
    }

    // Set default account (if not already configured)
    nomiclabsUtils.setNetworkFrom(network.config, accounts);

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
})
