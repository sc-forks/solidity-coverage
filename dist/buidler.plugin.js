const API = require('./../lib/api');
const utils = require('./plugin-assets/plugin.utils');
const buidlerUtils = require('./plugin-assets/buidler.utils');
const PluginUI = require('./plugin-assets/buidler.ui');

const pkg = require('./../package.json');
const death = require('death');
const path = require('path');
const Web3 = require('web3');
const ganache = require('ganache-cli');

const { task, types } = require("@nomiclabs/buidler/config");
const { ensurePluginLoadedWithUsePlugin } = require("@nomiclabs/buidler/plugins");

const {
  TASK_TEST,
  TASK_COMPILE,
} = require("@nomiclabs/buidler/builtin-tasks/task-names");

ensurePluginLoadedWithUsePlugin();

function plugin() {

  // UI for the task flags...
  const ui = new PluginUI();

  task("coverage", "Generates a code coverage report for tests")

    .addOptionalParam("testFiles",  ui.flags.file,       null, types.string)
    .addOptionalParam("solcoverjs", ui.flags.solcoverjs, null, types.string)
    .addOptionalParam('temp',       ui.flags.temp,       null, types.string)

    .setAction(async function(args, env){
      let error;
      let ui;
      let api;
      let config;

      try {
        death(buidlerUtils.finish.bind(null, config, api)); // Catch interrupt signals

        config = buidlerUtils.normalizeConfig(env.config, args);
        ui = new PluginUI(config.logger.log);
        api = new API(utils.loadSolcoverJS(config));

        // ==============
        // Server launch
        // ==============
        const network = buidlerUtils.setupNetwork(
          env,
          api,
          args,
          ui
        );

        const client = api.client || ganache;
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


        // Network Info
        const networkName = args.network || api.defaultNetworkName;

        ui.report('network', [
          networkName,
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
        utils.save(targets, config.paths.sources, tempContractsDir);
        utils.save(skipped, config.paths.sources, tempContractsDir);

        config.paths.sources = tempContractsDir;
        config.paths.artifacts = tempArtifactsDir;
        config.paths.cache = buidlerUtils.tempCacheDir(config);
        config.solc.optimizer.enabled = false;

        await env.run(TASK_COMPILE);

        await api.onCompileComplete(config);

        // ======
        // Tests
        // ======
        const testFiles = args.testFiles ? [args.testFiles] : [];

        try {
          await env.run(TASK_TEST, {testFiles: testFiles})
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
    }

    await buidlerUtils.finish(config, api);

    if (error !== undefined ) throw error;
    if (process.exitCode > 0) throw new Error(ui.generate('tests-fail', [process.exitCode]));
  })
}

module.exports = plugin;

