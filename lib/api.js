const shell = require('shelljs');
const pify = require('pify');
const fs = require('fs');
const path = require('path');
const istanbul = require('sc-istanbul');
const assert = require('assert');
const detect = require('detect-port');
const _ = require('lodash/lang');

const ConfigValidator = require('./validator');
const Instrumenter = require('./instrumenter');
const Coverage = require('./coverage');
const DataCollector = require('./collector');
const AppUI = require('./ui').AppUI;

/**
 * Coverage Runner
 */
class API {
  constructor(config={}) {
    this.coverage = new Coverage();
    this.instrumenter = new Instrumenter();
    this.validator = new ConfigValidator()
    this.config = config || {};

    // Validate
    this.validator.validate(this.config);

    // Options
    this.testsErrored = false;

    this.cwd = config.cwd || process.cwd();

    this.defaultHook = () => {};
    this.onServerReady = config.onServerReady           || this.defaultHook;
    this.onTestsComplete = config.onTestsComplete       || this.defaultHook;
    this.onCompileComplete = config.onCompileComplete   || this.defaultHook;
    this.onIstanbulComplete = config.onIstanbulComplete || this.defaultHook;

    this.server = null;
    this.defaultPort = 8555;
    this.client = config.client;
    this.defaultNetworkName = 'soliditycoverage';
    this.port = config.port || this.defaultPort;
    this.host = config.host || "127.0.0.1";
    this.providerOptions = config.providerOptions || {};
    this.autoLaunchServer = config.autoLaunchServer === false ? false : true;

    this.skipFiles = config.skipFiles || [];

    this.log = config.log || console.log;

    this.gasLimit = 0xffffffffff;            // default "gas sent" with transactions
    this.gasLimitString = "0xfffffffffff";   // block gas limit for ganache (higher than "gas sent")
    this.gasPrice = 0x01;

    this.istanbulFolder = config.istanbulFolder || false;
    this.istanbulReporter = config.istanbulReporter || ['html', 'lcov', 'text', 'json'];

    this.setLoggingLevel(config.silent);
    this.ui = new AppUI(this.log);
  }

  /**
   * Instruments a set of sources to prepare them for running under coverage
   * @param  {Object[]}  targets (see below)
   * @return {Object[]}          (see below)
   * @example of input/output array:
   * [{
   *   source:         (required) <solidity-source>,
   *   canonicalPath:  (required) <absolute path to source file>
   *   relativePath:   (optional) <rel path to source file for logging>
   * }]
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

        this.ui.report('instr-item', [currentFile]);

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
   * Returns a copy of the hit map created during instrumentation.
   * Useful if you'd like to delegate coverage collection to multiple processes.
   * @return {Object} instrumentationData
   */
  getInstrumentationData(){
    return _.cloneDeep(this.instrumenter.instrumentationData)
  }

  /**
   * Sets the hit map object generated during instrumentation. Useful if you'd like
   * to collect data for a pre-existing instrumentation.
   * @param {Object} data
   */
  setInstrumentationData(data={}){
    this.instrumenter.instrumentationData = _.cloneDeep(data);
  }

  /**
   * Enables coverage collection on in-process ethereum client server, hooking the DataCollector
   * to its VM. By default, method will return a url after server has begun listening on the port
   * specified in the config. When `autoLaunchServer` is false, method returns`ganache.server` so
   * the consumer can control the 'server.listen' invocation themselves.
   * @param  {Object} client             ganache client
   * @param  {Boolean} autoLaunchServer  boolean
   * @return {<Promise> (String | Server) }  address of server to connect to, or initialized, unlaunched server.
   */
  async ganache(client, autoLaunchServer){
    // Check for port-in-use
    if (await detect(this.port) !== this.port){
      throw new Error(this.ui.generate('server-fail', [this.port]))
    }

    this.collector = new DataCollector(this.instrumenter.instrumentationData);

    this.providerOptions.gasLimit =
      'gasLimit' in this.providerOptions
        ? this.providerOptions.gasLimit
        : this.gasLimitString;

    this.providerOptions.allowUnlimitedContractSize =
      'allowUnlimitedContractSize' in this.providerOptions
        ? this.providerOptions.allowUnlimitedContractSize
        : true;

    // Attach to vm step of supplied client
    try {
      if (this.config.forceBackupServer) throw new Error()
      await this.attachToVM(client)
    }

    // Fallback to ganache-cli)
    catch(err) {
      const _ganache = require('ganache-cli');
      this.ui.report('vm-fail', [_ganache.version]);
      await this.attachToVM(_ganache);
    }

    if (autoLaunchServer === false || this.autoLaunchServer === false){
      return this.server;
    }

    await pify(this.server.listen)(this.port);
    const address = `http://${this.host}:${this.port}`;
    this.ui.report('server', [address]);
    return address;
  }

  /**
   * Generate coverage / write coverage report / run istanbul
   */
  async report(_folder) {
    const folder = _folder || this.istanbulFolder;

    const collector = new istanbul.Collector();
    const reporter = new istanbul.Reporter(false, folder);

    return new Promise((resolve, reject) => {
      try {
        this.coverage.generate(this.instrumenter.instrumentationData);

        const mapping = this.makeKeysRelative(this.coverage.data, this.cwd);
        this.saveCoverage(mapping);

        collector.add(mapping);

        this.istanbulReporter.forEach(report => reporter.add(report));

        // Pify doesn't like this one...
        reporter.write(collector, true, (err) => {
          if (err) return reject(err);

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
  async attachToVM(client){
    const self = this;

    // Fallback to client from options
    if(!client) client = this.client;
    this.server = client.server(this.providerOptions);

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
