const API = require('./../lib/api');
const utils = require('./plugin-assets/plugin.utils');
const PluginUI = require('./plugin-assets/truffle.ui');

const pkg = require('./../package.json');
const death = require('death');
const path = require('path');
const Web3 = require('web3');


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
    death(utils.finish.bind(null, config, api)); // Catch interrupt signals

    ui = new PluginUI(config.logger.log);

    if(config.help) return ui.report('help');    // Exit if --help

    truffle = utils.loadTruffleLibrary(config);
    api = new API(utils.loadSolcoverJS(config));

    utils.setNetwork(config, api);

    // Server launch
    const address = await api.ganache(truffle.ganache);

    const web3 = new Web3(address);
    const accounts = await web3.eth.getAccounts();
    const nodeInfo = await web3.eth.getNodeInfo();
    const ganacheVersion = nodeInfo.split('/')[1];

    utils.setNetworkFrom(config, accounts);

    // Version Info
    ui.report('versions', [
      truffle.version,
      ganacheVersion,
      pkg.version
    ]);

    // Exit if --version
    if (config.version) return await utils.finish(config, api);

    ui.report('network', [
      config.network,
      config.networks[config.network].network_id,
      config.networks[config.network].port
    ]);

    // Run post-launch server hook;
    await api.onServerReady(config);

    // Instrument
    let {
      targets,
      skipped
    } = utils.assembleFiles(config, api.skipFiles);

    targets = api.instrument(targets);
    utils.reportSkipped(config, skipped);

    // Filesystem & Compiler Re-configuration
    const {
      tempArtifactsDir,
      tempContractsDir
    } = utils.getTempLocations(config);

    utils.save(targets, config.contracts_directory, tempContractsDir);
    utils.save(skipped, config.contracts_directory, tempContractsDir);

    config.contracts_directory = tempContractsDir;
    config.build_directory = tempArtifactsDir;

    config.contracts_build_directory = path.join(
      tempArtifactsDir,
      path.basename(config.contracts_build_directory)
    );

    config.all = true;
    config.test_files = utils.getTestFilePaths(config);
    config.compilers.solc.settings.optimizer.enabled = false;

    // Compile Instrumented Contracts
    await truffle.contracts.compile(config);

    // Run tests
    try {
      failures = await truffle.test.run(config)
    } catch (e) {
      error = e.stack;
    }

    await api.onTestsComplete(config);
    await api.report();
    await api.onIstanbulComplete(config);

  } catch(e){
    error = e;
  }

  // Finish
  await utils.finish(config, api);

  if (error !== undefined) throw error;
  if (failures > 0) throw new Error(ui.generate('tests-fail', [failures]));
}

module.exports = plugin;
