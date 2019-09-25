const shell = require('shelljs');
const pify = require('pify');
const fs = require('fs');
const path = require('path');
const istanbul = require('istanbul');
const util = require('util');
const assert = require('assert');
const detect = require('detect-port');

const ConfigValidator = require('./validator');
const Instrumenter = require('./instrumenter');
const Coverage = require('./coverage');
const DataCollector = require('./collector');
const AppUI = require('./ui').AppUI;

/**
 * Coverage Runner
 */
class API {
  constructor(config) {
    this.coverage = new Coverage();
    this.instrumenter = new Instrumenter();
    this.validator = new ConfigValidator()
    this.config = config || {};

    // Validate
    this.validator.validate(this.config);

    // Options
    this.testsErrored = false;

    this.cwd = config.cwd || process.cwd();
    this.originalContractsDir = config.originalContractsDir

    this.defaultHook = () => {};
    this.onServerReady = config.onServerReady           || this.defaultHook;
    this.onTestsComplete = config.onTestsComplete       || this.defaultHook;
    this.onCompileComplete = config.onCompileComplete   || this.defaultHook;
    this.onIstanbulComplete = config.onIstanbulComplete || this.defaultHook;

    this.server = null;
    this.provider = null;
    this.defaultPort = 8555;
    this.client = config.client;
    this.port = config.port || this.defaultPort;
    this.host = config.host || "127.0.0.1";
    this.providerOptions = config.providerOptions || {};


    this.skipFiles = config.skipFiles || [];

    this.log = config.log || console.log;

    this.gasLimit = 0xffffffffff;            // default "gas sent" with transactions
    this.gasLimitString = "0xfffffffffff";   // block gas limit for ganache (higher than "gas sent")
    this.gasPrice = 0x01;

    this.istanbulReporter = config.istanbulReporter || ['html', 'lcov', 'text'];

    this.setLoggingLevel(config.silent);
    this.ui = new AppUI(this.log);

  }

  /**
   * Instruments a set of sources to prepare them for running under coverage
   * @param  {Object[]}  targets (see below)
   * @return {Object[]}          (see below)
   * @example:
   *
   *  targets:
   *  [{
   *    canonicalPath: <absolute-path>
   *    relativePath: <relative-path>
   *    source: <source-file>
   *
   *  },...]
   *
   *  outputs:
   *  [{
   *    canonicalPath: <path>
   *    source: <instrumented-source-file>
   *  }...]
   */
  instrument(targets=[]) {
    let currentFile;      // Keep track of filename in case we crash...
    let started = false;
    let outputs = [];

    try {
      for (let target of targets) {
        currentFile = target.relativePath || target.canonicalPath;

        if(!started){
          started = true;
          this.ui.report('instr-start');
        }

        this.ui.report('instr-item', [target.relativePath]);

        const instrumented = this.instrumenter.instrument(
          target.source,
          target.canonicalPath
        );

        this.coverage.addContract(instrumented, target.canonicalPath);

        outputs.push({
          canonicalPath: target.canonicalPath,
          relativePath: target.relativePath,
          source: instrumented.contract
        })
      }

    } catch (err) {
      err.message = this.ui.generate('instr-fail', [currentFile]) + err.message;
      throw err;
    }

    return outputs;
  }

  /**
   * Launches an in-process ethereum client server, hooking the DataCollector to its VM.
   * @param  {Object} client ganache client
   * @return {String}        address of server to connect to
   */
  async ganache(client){
    let retry = false;
    let address = `http://${this.host}:${this.port}`;

    // Check for port-in-use
    if (await detect(this.port) !== this.port){
      throw new Error(this.ui.generate('server-fail', [this.port]))
    }

    if(!this.client) this.client = client; // Prefer client from options

    this.collector = new DataCollector(this.instrumenter.instrumentationData);

    this.providerOptions.gasLimit = this.gasLimitString;
    this.providerOptions.allowUnlimitedContractSize = true;

    // Launch server and attach to vm step of supplied client
    try {
      if (this.config.forceBackupServer) throw new Error()
      await this.attachToVM()
    }

    // Fallback to ganache-core-sc (eq: ganache-core 2.7.0)
    catch(err) {
      this.ui.report('vm-fail', []);
      this.client = require('ganache-core-sc');
      await this.attachToVM();
    }

    this.ui.report('server', [address]);
    return address;
  }

  /**
   * Generate coverage / write coverage report / run istanbul
   */
  async report() {
    const collector = new istanbul.Collector();
    const reporter = new istanbul.Reporter();

    return new Promise((resolve, reject) => {
      try {
        this.coverage.generate(
          this.instrumenter.instrumentationData,
          this.originalContractsDir
        );

        const mapping = this.makeKeysRelative(this.coverage.data, this.cwd);
        this.saveCoverage(mapping);

        collector.add(mapping);

        this.istanbulReporter.forEach(report => reporter.add(report));

        // Pify doesn't like this one...
        reporter.write(collector, true, (err) => {
          if (err) throw err;
          this.ui.report('istanbul');
          resolve();
        });

      } catch (error) {
        error.message = this.ui.generate('istanbul-fail') + error.message;
        throw error;
      }
    })
  }


  /**
   * Removes coverage build artifacts, kills testrpc.
   */
  async finish() {
    if (this.server && this.server.close){
      this.ui.report('finish');
      await pify(this.server.close)();
    }
  }
  // ------------------------------------------ Utils ----------------------------------------------

  // ========
  // Provider
  // ========
  async attachToVM(){
    const self = this;

    this.server = this.client.server(this.providerOptions);

    this.assertHasBlockchain(this.server.provider);
    await this.vmIsResolved(this.server.provider);

    const blockchain = this.server.provider.engine.manager.state.blockchain;
    const createVM = blockchain.createVMFromStateTrie;

    // Attach to VM which ganache has already created for transactions
    blockchain.vm.on('step', self.collector.step.bind(self.collector));

    // Hijack createVM method which ganache runs for each `eth_call`
    blockchain.createVMFromStateTrie = function(state, activatePrecompiles) {
      const vm = createVM.apply(blockchain, arguments);
      vm.on('step', self.collector.step.bind(self.collector));
      return vm;
    }

    // NB: EADDRINUSE errors are uncatch-able?
    pify(this.server.listen)(this.port);
  }

  assertHasBlockchain(provider){
    assert(provider.engine.manager.state.blockchain !== undefined);
    assert(provider.engine.manager.state.blockchain.createVMFromStateTrie !== undefined);
  }

  async vmIsResolved(provider){
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (provider.engine.manager.state.blockchain.vm !== undefined){
          clearInterval(interval);
          resolve();
        }
      });
    })
  }

  // ========
  // File I/O
  // ========

  saveCoverage(data){
    const covPath = path.join(this.cwd, "coverage.json");
    fs.writeFileSync(covPath, JSON.stringify(data));
  }

  // =====
  // Paths
  // =====
  //
  /**
   * Relativizes path keys so that istanbul report can be read on Windows
   * @param  {Object} map  coverage map generated by coverageMap
   * @param  {String} wd   working directory
   * @return {Object}      map with relativized keys
   */
  makeKeysRelative(map, wd) {
    const newCoverage = {};

    Object
     .keys(map)
     .forEach(pathKey => newCoverage[path.relative(wd, pathKey)] = map[pathKey]);

    return newCoverage;
  }

  // =======
  // Logging
  // =======

  /**
   * Turn logging off (for CI)
   * @param {Boolean} isSilent
   */
  setLoggingLevel(isSilent) {
    if (isSilent) this.log = () => {};
  }

}

module.exports = API;
