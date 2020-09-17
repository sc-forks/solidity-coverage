const API = require('./../lib/api');
const utils = require('./resources/plugin.utils');
const buidlerUtils = require('./resources/buidler.utils');
const PluginUI = require('./resources/buidler.ui');

const pkg = require('./../package.json');
const death = require('death');
const path = require('path');
const Web3 = require('web3');

const { task, types } = require("@nomiclabs/buidler/config");

const {
  TASK_TEST,
  TASK_COMPILE,
  TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
  TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
} = require("@nomiclabs/buidler/builtin-tasks/task-names");

function plugin() {

  // UI for the task flags...
  const ui = new PluginUI();

  let measureCoverage = false;
  let instrumentedSources;

  task(TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT).setAction(async (_, { config }, runSuper) => {
    const solcInput = await runSuper();
    if (measureCoverage) {
      // The fully qualified name here is actually the global name in the solc input,
      // but buidler uses the fully qualified contract names
      for (const [fullyQualifiedName, source] of Object.entries(solcInput.sources)) {
        const absolutePath = path.join(path.dirname(config.paths.sources), fullyQualifiedName);
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

  task("coverage", "Generates a code coverage report for tests")

    .addOptionalParam("testfiles",  ui.flags.file,       "", types.string)
    .addOptionalParam("solcoverjs", ui.flags.solcoverjs, "", types.string)
    .addOptionalParam('temp',       ui.flags.temp,       "", types.string)

    .setAction(async function(args, env){
      let error;
      let ui;
      let api;
      let config;
      instrumentedSources = {};

      try {
        death(buidlerUtils.finish.bind(null, config, api)); // Catch interrupt signals

        config = buidlerUtils.normalizeConfig(env.config, args);
        ui = new PluginUI(config.logger.log);
        api = new API(utils.loadSolcoverJS(config));

        // ==============
        // Server launch
        // ==============
        const network = buidlerUtils.setupNetwork(env, api, ui);

        const client = api.client || require('ganache-cli');
        const address = await api.ganache(client);
        const web3 = new Web3(address);
        const accounts = await web3.eth.getAccounts();
        const nodeInfo = await web3.eth.getNodeInfo();
        const ganacheVersion = nodeInfo.split('/')[1];

        // Set default account
        network.from = accounts[0];

        // Version Info
        ui.report('versions', [
          ganacheVersion,
          pkg.version
        ]);

        ui.report('network', [
          env.network.name,
          api.port
        ]);

        // Run post-launch server hook;
        await api.onServerReady(config);

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
        config.paths.cache = buidlerUtils.tempCacheDir(config);

        measureCoverage = true;
        await env.run(TASK_COMPILE);

        await api.onCompileComplete(config);

        // ======
        // Tests
        // ======
        const testfiles = args.testfiles
          ? buidlerUtils.getTestFilePaths(args.testfiles)
          : [];

        try {
          await env.run(TASK_TEST, {testFiles: testfiles})
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

    await buidlerUtils.finish(config, api);

    if (error !== undefined ) throw error;
    if (process.exitCode > 0) throw new Error(ui.generate('tests-fail', [process.exitCode]));
  });
}

module.exports = plugin;
