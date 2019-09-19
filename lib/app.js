const shell = require('shelljs');
const pify = require('pify');
const fs = require('fs');
const path = require('path');
const istanbul = require('istanbul');
const util = require('util');
const assert = require('assert');

const ConfigValidator = require('./validator');
const Instrumenter = require('./instrumenter');
const Coverage = require('./coverage');
const DataCollector = require('./collector');
const AppUI = require('./ui').AppUI;

const isWin = /^win/.test(process.platform);

/**
 * Coverage Runner
 */
class App {
  constructor(config) {
    this.coverage = new Coverage();
    this.instrumenter = new Instrumenter();
    this.validator = new ConfigValidator()
    this.config = config || {};

    // Validate
    this.validator.validate(this.config);

    // Options
    this.testsErrored = false;
    this.instrumentToFile = (config.instrumentToFile === false) ? false : true;

    this.cwd = config.cwd || process.cwd();
    this.contractsDirName = '.coverage_contracts';
    this.artifactsDirName = '.coverage_artifacts';
    this.contractsDir = path.join(this.cwd, this.contractsDirName);
    this.artifactsDir = path.join(this.cwd, this.artifactsDirName);

    this.originalContractsDir = config.originalContractsDir

    this.server = null;
    this.provider = null;
    this.defaultPort = 8555;
    this.client = config.client;
    this.port = config.port || this.defaultPort;
    this.host = config.host || "127.0.0.1";
    this.providerOptions = config.providerOptions || {};

    this.skippedFolders = [];
    this.skipFiles = config.skipFiles || [];

    this.log = config.log || console.log;

    this.gasLimit = 0xfffffffffff;
    this.gasLimitString = "0xfffffffffff";
    this.gasPrice = 0x01;

    this.istanbulReporter = config.istanbulReporter || ['html', 'lcov', 'text'];

    this.setLoggingLevel(config.silent);
    this.ui = new AppUI(this.log);

  }

  // --------------------------------------  Methods -----------------------------------------------
  /**
   * Setup temp folder, write instrumented contracts to it and register them as coverage targets
   *
   *  TODO: This function should be completely rewritten so that file loading, skip-filters and
   *  saving are done by the plugin API.
   *
   *  Input should be array of these...
   *  {
   *    canonicalPath: <path>
   *    source: <source-file>
   *  }
   *
   *  Output should be array of these...:
   *  {
   *    canonicalPath: <path>
   *    source: <instrumented-source-file>
   *  }
   */
  instrument(targetFiles=[]) {
    let targets;
    let currentFile;      // Keep track of filename in case we crash...
    let started = false;
    let skipped = [];

    try {
      this.registerSkippedItems();

      (targetFiles.length)
        ? targets = targetFiles
        : targets = shell.ls(`${this.contractsDir}/**/*.sol`);

      targets.forEach(file => {
        currentFile = file;

        if (!this.shouldSkip(file)) {
          !started && this.ui.report('instr-start');
          started = true;

          // Remember the real path
          const contractPath = this.platformNeutralPath(file);
          const relativePath = this.toRelativePath(contractPath, this.contractsDirName);
          const canonicalPath = path.join(
            this.originalContractsDir,
            relativePath
          );

          this.ui.report('instr-item', [relativePath])

          // Instrument contract, save, add to coverage map
          const contract = this.loadContract(contractPath);
          const instrumented = this.instrumenter.instrument(contract, canonicalPath);
          this.saveContract(contractPath, instrumented.contract);
          this.coverage.addContract(instrumented, canonicalPath);

        } else {
          skipped.push(file);
        }
      });
    } catch (err) {
      const name = this.toRelativePath(currentFile, this.contractsDirName);
      err.message = this.ui.generate('instr-fail', [name]) + err.message;
      throw err;
    }

    if (skipped.length > 0){
      this.ui.report('instr-skip');

      skipped.forEach(item => {
        item = item.split(`/${this.contractsDirName}`)[1]
        this.ui.report('instr-skipped', [item])
      });
    }
  }

  /**
   * Launch an in-process ethereum client and hook up the DataCollector to its VM.
   * @param  {Object} client ethereum client
   * @return {Object}        provider
   *
   * TODO: generalize provider options setting for non-ganache clients..
   */
  async ganache(client){
    let retry = false;
    let address = `http://${this.host}:${this.port}`;

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

      try { await this.attachToVM() }

      catch(err) {
        err.message = `${this.ui.generate('server-fail', [address])} ${err.message}`;
        throw err;
      }
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

  // ============
  // Public Utils
  // ============

  /**
   * Should only be run before any temporary folders are created.
   * It checks for existence of contract sources, server port conflicts
   * and sweeps away debris left over from an uncontrolled crash.
   */
  sanityCheckContext(){
    if (!shell.test('-e', this.originalContractsDir)){
      const msg = this.ui.generate('sources-fail', [this.originalContractsDir])
      throw new Error(msg);
    }

    if (shell.test('-e', this.contractsDir)){
      shell.rm('-Rf', this.contractsDir);
    }

    if (shell.test('-e', this.artifactsDir)){
      shell.rm('-Rf', this.artifactsDir);
    }
  }

  /**
   * Creates two temporary folders in the cwd and
   * copies contract sources to a temp contracts folder prior to their
   * instrumentation. This method is useful for plugin APIs that
   * consume contracts and build artifacts from configurable locations.
   *
   * .coverage_contracts/
   * .coverage_artifacts/
   */
  generateStandardEnvironment(){
    shell.mkdir(this.contractsDir);
    shell.mkdir(this.artifactsDir);
    shell.cp('-Rf', `${this.originalContractsDir}/*`, this.contractsDir);
  }

  /**
   * Removes coverage build artifacts, kills testrpc.
   */
  async cleanUp() {
    const self = this;
    shell.config.silent = true;
    shell.rm('-Rf', this.contractsDir);
    shell.rm('-Rf', this.artifactsDir);

    if (this.server && this.server.close){
      this.ui.report('cleanup');
      await pify(self.server.close)();
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

    await pify(this.server.listen)(this.port);
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
  loadContract(_path){
    return fs.readFileSync(_path).toString();
  }

  saveContract(_path, contract){
    fs.writeFileSync(_path, contract);
  }

  saveCoverage(data){
    const covPath = path.join(this.cwd, "coverage.json");
    fs.writeFileSync(covPath, JSON.stringify(data));
  }

  // =====
  // Paths
  // =====
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

  toRelativePath(absolutePath, parentDir){
    return absolutePath.split(`/${parentDir}`)[1]
  }

  /**
   * Normalizes windows paths
   * @param  {String} file path
   * @return {String}      normalized path
   */
  platformNeutralPath(file) {
    return (isWin)
      ? path.resolve(file).split('\\').join('/')
      : path.resolve(file);
  }

  // ========
  // Skipping
  // ========
  /**
   * Determines if a file is in a folder marked skippable in a standard environment where
   * instrumented files are in their own temporary folder.
   * @param  {String} file   file path
   * @return {Boolean}
   */
  inSkippedFolder(file){
    let shouldSkip;
    const root = `${this.contractsDir}`;
    this.skippedFolders.forEach(folderToSkip => {
      folderToSkip = `${root}/${folderToSkip}`;
      if (file.indexOf(folderToSkip) === 0)
        shouldSkip = true;
    });
    return shouldSkip;
  }

  /**
   * Parses the skipFiles option (which also accepts folders) in a standard environment where
   * instrumented files are in their own temporary folder.
   */
  registerSkippedItems(){
    const root = `${this.contractsDir}`;
    this.skippedFolders = this.skipFiles.filter(item => path.extname(item) !== '.sol')
    this.skipFiles = this.skipFiles.map(contract => `${root}/${contract}`);
    this.skipFiles.push(`${root}/Migrations.sol`);
  }

  /**
   * Returns true when file should not be instrumented, false otherwise.
   * This method should be overwritten if plugin does in-flight instrumentation
   * @param  {String} file path segment
   * @return {Boolean}
   */
  shouldSkip(file){
    return this.skipFiles.includes(file) || this.inSkippedFolder(file)
  }

  // =======
  // Logging
  // =======
  /**
   * Turn logging off (for CI)
   * @param {Boolean} isSilent
   *
   * TODO: logic to toggle on/off (instead of just off)
   *
   */
  setLoggingLevel(isSilent) {
    if (isSilent) this.log = () => {};
  }

}

module.exports = App;
