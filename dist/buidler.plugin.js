const API = require('./../lib/api');
const utils = require('./plugin-assets/plugin.utils');
const buidlerUtils = require('./plugin-assets/buidler.utils');
const PluginUI = require('./plugin-assets/buidler.ui');

const pkg = require('./../package.json');
const death = require('death');
const path = require('path');
const Web3 = require('web3');
const ganache = require('ganache-cli');

const { task, internalTask, types } = require("@nomiclabs/buidler/config");
const { ensurePluginLoadedWithUsePlugin } = require("@nomiclabs/buidler/plugins");
const { BuidlerPluginError } = require("@nomiclabs/buidler/internal/core/errors");
const { createProvider } = require("@nomiclabs/buidler/internal/core/providers/construction");

const {
  TASK_TEST_RUN_MOCHA_TESTS,
  TASK_TEST,
  TASK_COMPILE,
} = require("@nomiclabs/buidler/builtin-tasks/task-names");

const util = require('util');

function plugin() {
  let api;
  let address;
  let network;
  let error;
  let testsErrored = false;

  const ui = new PluginUI();

  extendEnvironment(env => {
    env.config.logger = {log: null};
    env.config = buidlerUtils.normalizeConfig(env.config);

    api = new API(utils.loadSolcoverJS(env.config));

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

    // Keep a reference so we can set the from account
    network = env.network;
  })

  function myTimeout(){
    return new Promise(resolve => {
      setTimeout(()=>{
        console.log('TIMEOUT')
      }, 2000)
    })
  }


  task("timeout", 'desc').setAction(async function(taskArguments, { config }, runSuper){
    await myTimeout();
  });

  task("coverage", "Generates a code coverage report for tests")

    .addOptionalParam("file",       ui.flags.file,       null, types.string)
    .addOptionalParam("solcoverjs", ui.flags.solcoverjs, null, types.string)
    .addOptionalParam('temp',       ui.flags.temp,       null, types.string)

    .setAction(async function(taskArguments, { run, config }, runSuper){
      console.log(util.inspect())
      try {
        death(buidlerUtils.finish.bind(null, config, api)); // Catch interrupt signals
        config.logger = {log: null};
        config = buidlerUtils.normalizeConfig(config);

        api = new API(utils.loadSolcoverJS(config));

        // Server launch
        const address = await api.ganache(ganache);
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
        ui.report('network', [
          api.defaultNetworkName,
          api.port
        ]);

        // Run post-launch server hook;
        await api.onServerReady(config);

        // Instrument
        const skipFiles = api.skipFiles || [];

        let {
          targets,
          skipped
        } = utils.assembleFiles(config, skipFiles);

        targets = api.instrument(targets);
        utils.reportSkipped(config, skipped);

        // Filesystem & Compiler Re-configuration
        const {
          tempArtifactsDir,
          tempContractsDir
        } = utils.getTempLocations(config);

        utils.save(targets, config.paths.sources, tempContractsDir);
        utils.save(skipped, config.paths.sources, tempContractsDir);

        config.paths.sources = tempContractsDir;
        config.paths.artifacts = tempArtifactsDir;
        config.paths.cache = buidlerUtils.tempCacheDir(config);
        console.log(config.paths.cache)

        config.solc.optimizer.enabled = false;
        await run(TASK_COMPILE);

        await api.onCompileComplete(config);

        try {
          failures = await run(TASK_TEST, {testFiles: []})
        } catch (e) {
          error = e.stack;
          console.log(e.message + error)
        }
        await api.onTestsComplete(config);

        // Run Istanbul
        await api.report();
        await api.onIstanbulComplete(config);
    } catch(e) {
       error = e;
    }
  })
}

module.exports = plugin;

