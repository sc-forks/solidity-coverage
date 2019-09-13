const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const istanbul = require('istanbul');
const util = require('util');
const assert = require('assert');
const pify = require('pify');

const Instrumenter = require('./instrumenter');
const Coverage = require('./coverage');
const DataCollector = require('./collector');
const UI = require('./ui');

const isWin = /^win/.test(process.platform);

/**
 * Coverage Runner
 */
class App {
  constructor(config) {
    this.coverage = new Coverage();
    this.instrumenter = new Instrumenter();
    this.config = config || {};

    // Options
    this.testsErrored = false;

    this.cwd = config.cwd;
    this.contractsDirName = '.coverage_contracts';
    this.artifactsDirName = '.coverage_artifacts';
    this.contractsDir = path.join(this.cwd, this.contractsDirName);
    this.artifactsDir = path.join(this.cwd, this.artifactsDirName);

    this.originalContractsDir = config.originalContractsDir

    this.client = config.client;
    this.server = null;
    this.providerOptions = config.providerOptions || {};
    this.defaultPort = 8777;

    this.skippedFolders = [];
    this.skipFiles = config.skipFiles || [];

    this.log = config.logger ? config.logger.log : console.log;
    this.setLoggingLevel(config.silent);

    this.gasLimit = 0xfffffffffff;
    this.gasLimitString = "0xfffffffffff";
    this.gasPrice = 0x01;

    this.istanbulReporter = config.istanbulReporter || ['html', 'lcov', 'text'];
    this.ui = new UI(this.log);
  }

  // --------------------------------------  Methods -----------------------------------------------
  /**
   * Setup temp folder, write instrumented contracts to it and register them as coverage targets
   */
  instrument() {
    let currentFile;
    let started = false;
    let skipped = [];

    try {
      this.sanityCheckContext();
      this.registerSkippedItems();
      this.generateEnvelope();

      const target = `${this.contractsDir}/**/*.sol`;

      shell.ls(target).forEach(file => {
        currentFile = file;

        if (!this.shouldSkip(file)) {
          !started && this.ui.report('instr-start');
          started = true;

          // Remember the real path
          const contractPath = this.platformNeutralPath(file);
          const relativePath = contractPath.split(`/${this.contractsDirName}`)[1]
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
      const msg = `There was a problem instrumenting ${currentFile}: `;
      this.cleanUp(msg + err);
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
   * Launch an in-process ethereum provider and hook up the DataCollector to its VM.
   * @param  {Object} client ethereum client
   * @return {Object}        provider
   *
   * TODO: generalize provider options setting for non-ganache clients..
   */
  async provider(client){
    let retry = false;

    if(!this.client) this.client = client; // Prefer client from options

    this.collector = new DataCollector(this.instrumenter.instrumentationData);

    this.providerOptions.gasLimit = this.gasLimitString;
    this.providerOptions.allowUnlimitedContractSize = true;

    // Try to launch provider and attach to vm step of
    // either plugin's ganache or a provider passed via options
    try {
      this.provider = await this.attachToVM();
    } catch(err){
      console.log('err --> ' + err);
      retry = true;
      this.ui.report('vm-fail', [])
    }

    // Fallback to ganache-core-sc (eq: ganache-core 2.7.0)
    if (retry){
      this.providerOptions.logger = { log: this.collector.step.bind(this.collector) };
      this.client = require('ganache-core-sc');
      this.provider = this.client.provider(this.providerOptions);
    }

    return this.provider;
  }

  /**
   * Generate coverage / write coverage report / run istanbul
   */
  async report() {
    const collector = new istanbul.Collector();
    const reporter = new istanbul.Reporter();

    return new Promise((resolve, reject) => {
      try {
        this.coverage.generate(this.instrumenter.instrumentationData, this.originalContractsDir);
        const relativeMapping = this.makeKeysRelative(this.coverage.data, this.cwd);
        this.saveCoverage(relativeMapping);

        collector.add(relativeMapping);

        this.istanbulReporter.forEach(report => reporter.add(report));

        reporter.write(collector, true, () => {
          this.log('Istanbul coverage reports generated');
          resolve();
        });
      } catch (err) {
        const msg = 'There was a problem generating the coverage map / running Istanbul.\n';
        console.log(err.stack);
        throw new Error(msg + err);
      }
    });
  }

  /**
   * Removes coverage build artifacts, kills testrpc.
   * Exits (1) and prints msg on error, exits (0) otherwise.
   * @param  {String} err error message
   *
   * TODO this needs to delegate process exit to the outer tool....
   */
  async cleanUp(err) {
    const self = this;
    this.log('Cleaning up...');
    shell.config.silent = true;
    shell.rm('-Rf', this.contractsDir);
    shell.rm('-Rf', this.artifactsDir);

    if (this.provider && this.provider.close){
      this.log('Shutting down ganache-core.server')
      await pify(self.server.close)();
    }
  }
  // ------------------------------------------ Utils ----------------------------------------------

  // ========
  // Provider
  // ========
  async attachToVM(){
    const self = this;
    const port = this.providerOptions.port || this.defaultPort;
    this.server = this.client.server(this.providerOptions);
    const provider = this.server.provider;

    this.assertHasBlockchain(provider);

    await this.vmIsResolved(provider);

    const blockchain = provider.engine.manager.state.blockchain;
    const createVM = blockchain.createVMFromStateTrie;

    // Attach to VM which ganache has already instantiated
    // and which it uses to execute eth_send
    blockchain.vm.on('step', self.collector.step.bind(self.collector));

    // Attach/hijack createVM method which ganache uses to run eth_calls
    blockchain.createVMFromStateTrie = function(state, activatePrecompiles) {
      const vm = createVM.apply(blockchain, arguments);
      vm.on('step', self.collector.step.bind(self.collector));
      return vm;
    }

    await pify(this.server.listen)(port);
    return provider;
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

  // ======
  // Launch
  // ======
  sanityCheckContext(){
    if (!shell.test('-e', this.originalContractsDir)){
      this.cleanUp("Couldn't find a 'contracts' folder to instrument.");
    }

    if (shell.test('-e', this.contractsDir)){
      shell.rm('-Rf', this.contractsDir);
    }

    if (shell.test('-e', this.artifactsDir)){
      shell.rm('-Rf', this.artifactsDir);
    }
  }

  generateEnvelope(){
    shell.mkdir(this.contractsDir);
    shell.mkdir(this.artifactsDir);
    shell.cp('-Rf', `${this.originalContractsDir}/*`, this.contractsDir);
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
    Object.keys(map).forEach(pathKey => newCoverage[path.relative(wd, pathKey)] = map[pathKey]);
    return newCoverage;
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
   * Determines if a file is in a folder marked skippable.
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
   * Parses the skipFiles option (which also accepts folders)
   */
  registerSkippedItems(){
    const root = `${this.contractsDir}`;
    this.skippedFolders = this.skipFiles.filter(item => path.extname(item) !== '.sol')
    this.skipFiles = this.skipFiles.map(contract => `${root}/${contract}`);
    this.skipFiles.push(`${root}/Migrations.sol`);
  }

  /**
   * Returns true when file should not be instrumented, false otherwise
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
