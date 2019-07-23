const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const istanbul = require('istanbul');

const Instrumenter = require('./instrumenter');
const Coverage = require('./coverage');

const isWin = /^win/.test(process.platform);

const gasLimitHex = 0xfffffffffff;               // High gas block limit / contract deployment limit
const gasPriceHex = 0x01;                        // Low gas price

/**
 * Coverage Runner
 */
class App {
  constructor(config) {
    this.coverage = new Coverage();
    this.instrumenter = new Instrumenter();
    this.provider = config.provider;

    // Options
    this.silence = '';                           // Default log level (passed to shell)
    this.log = config.logger || console.log;     // Configurable logging

    // Other
    this.testsErrored = false;                   // Toggle true when tests error
    this.skippedFolders = [];

    // Config
    this.config = config || {};
    this.contractsDir = config.contractsDir || 'contracts';
    this.coverageDir = './.coverageEnv';         // Contracts dir of instrumented .sols
    this.workingDir = config.dir || '.';         // Relative path to contracts folder
    this.skipFiles = config.skipFiles || [];     // Files to exclude from instrumentation
    this.setLoggingLevel(config.silent);
  }

  // --------------------------------------  Methods ------------------------------------------------

  /**
   * Generates a copy of the target project configured for solidity-coverage and saves to
   * the coverage environment folder.
  */
  generateCoverageEnvironment() {
    this.log('Generating coverage environment');

    try {
      this.sanityCheckContext();
      this.identifySkippedFolders();

      shell.mkdir(this.coverageDir);
      shell.cp('-Rf', this.contractsDir, this.coverageDir)

    } catch (err) {
      const msg = ('There was a problem generating the coverage environment: ');
      this.cleanUp(msg + err);
    }
  }

  /**
   * For each contract except migrations.sol (or those in skipFiles):
   * + Generate file path reference for coverage report
   * + Load contract as string
   * + Instrument contract
   * + Save instrumented contract to a temp folder which will be the new 'contractsDir for tests'
   * + Add instrumentation info to the coverage map
   */

  instrumentTarget() {
    this.skipFiles = this.skipFiles.map(contract => `${this.coverageDir}/${contract}`);
    this.skipFiles.push(`${this.coverageDir}/Migrations.sol`);

    let currentFile;
    try {
      shell.ls(`${this.coverageDir}/**/*.sol`).forEach(file => {
        currentFile = file;

        if (!this.skipFiles.includes(file) && !this.inSkippedFolder(file)) {
          this.log('Instrumenting ', file);

          // Remember the real path
          const contractPath = this.platformNeutralPath(file);
          const working = this.workingDir.substring(1);
          const canonicalPath = contractPath.split('/coverageEnv').join(working);

          // Instrument contract, save, add to coverage map
          const contract = this.loadContract(contractPath);
          const instrumented = this.instrumenter.instrument(contract, canonicalPath);
          this.saveContract(contractPath, instrumented.contract);
          this.coverage.addContract(instrumented, canonicalPath);

        } else {
          this.log('Skipping instrumentation of ', file);
        }
      });
    } catch (err) {
      const msg = `There was a problem instrumenting ${currentFile}: `;
      this.cleanUp(msg + err);
    }

    this.collector = new DataCollector(
      this.provider,
      this.instrumenter.intrumentationData
    )
  }

  /**
   * Generate coverage / write coverage report / run istanbul
   */
  async generateReport() {
    const collector = new istanbul.Collector();
    const reporter = new istanbul.Reporter();

    return new Promise((resolve, reject) => {
      try {
        const contractsPath = `${this.workingDir}/${this.config.contractsDir}`
        this.coverage.generate(this.instrumenter.instrumentationData, contractsPath);

        const relativeMapping = this.makeKeysRelative(this.coverage.data, this.workingDir);
        this.saveCoverage(relativeMapping);

        collector.add(relativeMapping);
        reporter.add('html');
        reporter.add('lcov');
        reporter.add('text');

        reporter.write(collector, true, () => {
          this.log('Istanbul coverage reports generated');
          this.cleanUp();
          resolve();
        });
      } catch (err) {
        const msg = 'There was a problem generating the coverage map / running Istanbul.\n';
        console.log(err.stack);
        this.cleanUp(msg + err);
      }
    });
  }

  // ------------------------------------------ Utils ----------------------------------------------
  loadContract(_path){
    return fs.readFileSync(_path).toString();
  }

  saveContract(_path, contract){
    fs.writeFileSync(_path, contract);
  }

  saveCoverage(coverageObject){
    fs.writeFileSync('./coverage.json', JSON.stringify(coverageObject));
  }

  sanityCheckContext(){
    if (!shell.test('-e', `${this.workingDir}/contracts`)){
      this.cleanUp("Couldn't find a 'contracts' folder to instrument.");
    }

    if (shell.test('-e', `${this.workingDir}/${this.coverageDir}`)){
      shell.rm('-Rf', this.coverageDir);
    }
  }

  /**
   * Relativizes path keys so that istanbul report can be read on Windows
   * @param  {Object} map  coverage map generated by coverageMap
   * @param  {[type]} root working directory
   * @return {[type]}      map with relativized keys
   */
  makeKeysRelative(map, root) {
    const newCoverage = {};
    Object.keys(map).forEach(pathKey => newCoverage[path.relative(root, pathKey)] = map[pathKey]);
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

  /**
   * Determines if a file is in a folder marked skippable.
   * @param  {String} file   file path
   * @return {Boolean}
   */
  inSkippedFolder(file){
    let shouldSkip;
    this.skippedFolders.forEach(folderToSkip => {
      folderToSkip = `${this.coverageDir}/contracts/${folderToSkip}`;
      if (file.indexOf(folderToSkip) === 0)
        shouldSkip = true;
    });
    return shouldSkip;
  }

  /**
   * Helper for parsing the skipFiles option, which also accepts folders.
   */
  identifySkippedFolders(){
    let files = shell.ls('-A', this.workingDir);

    this.skipFiles.forEach(item => {
      if (path.extname(item) !== '.sol')
        this.skippedFolders.push(item);
    });
  }

  /**
   * Allows config to turn logging off (for CI)
   * @param {Boolean} isSilent
   */
  setLoggingLevel(isSilent) {
    if (isSilent) {
      this.silence = '> /dev/null 2>&1';
      this.log = () => {};
    }
  }



  /**
   * Removes coverage build artifacts, kills testrpc.
   * Exits (1) and prints msg on error, exits (0) otherwise.
   * @param  {String} err error message
   *
   * TODO this needs to delegate process exit to the outer tool....
   */
  cleanUp(err) {
    const self = this;
    function exit(err){
      if (err) {
        self.log(`${err}\nExiting without generating coverage...`);
        process.exit(1);
      } else if (self.testsErrored) {
        self.log('Some truffle tests failed while running coverage');
        process.exit(1);
      } else {
        self.log('Done.');
        process.exit(0);
      }
    }

    self.log('Cleaning up...');
    shell.config.silent = true;
    shell.rm('-Rf', self.coverageDir);
    exit(err);
  }
}

module.exports = App;
