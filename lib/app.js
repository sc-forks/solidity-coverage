const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const childprocess = require('child_process');
const readline = require('readline');
const reqCwd = require('req-cwd');
const istanbul = require('istanbul');
const treeKill = require('tree-kill');
const getInstrumentedVersion = require('./instrumentSolidity.js');
const CoverageMap = require('./coverageMap.js');
const defaultTruffleConfig = require('./truffleConfig.js');
const preprocessor = require('./preprocessor');

const isWin = /^win/.test(process.platform);

const gasLimitHex = 0xfffffffffff;               // High gas block limit / contract deployment limit
const gasPriceHex = 0x01;                        // Low gas price

/**
 * Coverage Runner
 */
class App {
  constructor(config) {
    this.coverageDir = './coverageEnv';          // Env that instrumented .sols are tested in

    // Options
    this.network = '';                           // Default truffle network execution flag
    this.silence = '';                           // Default log level passed to shell
    this.log = console.log;

    // Other
    this.testrpcProcess = null;                  // ref to testrpc server we need to close on exit
    this.events = null;                           // ref to string array loaded from 'allFiredEvents'
    this.testsErrored = null;                    // flag set to non-null if truffle tests error
    this.coverage = new CoverageMap();           // initialize a coverage map
    this.originalArtifacts = [];                 // Artifacts from original build (we swap these in)
    this.skippedFolders = [];

    // Config
    this.config = config || {};
    this.workingDir = config.dir || '.';         // Relative path to contracts folder
    this.accounts = config.accounts || 35;       // Number of accounts to testrpc launches with
    this.skipFiles = config.skipFiles || [];     // Which files should be skipped during instrumentation
    this.norpc = config.norpc || false;          // Launch testrpc-sc internally?
    this.port = config.port || 8555;             // Port testrpc should listen on

    this.copyNodeModules = config.copyNodeModules || false;  // Copy node modules into coverageEnv?
    this.copyPackages = config.copyPackages || [];           // Only copy specific node_modules packages into coverageEnv
    this.testrpcOptions = config.testrpcOptions || null;     // Options for testrpc-sc
    this.testCommand = config.testCommand || null;           // Optional test command
    this.compileCommand = config.compileCommand || null;     // Optional compile command

    this.setLoggingLevel(config.silent);
  }

  // --------------------------------------  Methods ------------------------------------------------

  /**
   * Generates a copy of the target project configured for solidity-coverage and saves to
   * the coverage environment folder. Process exits(1) if try fails
  */
  generateCoverageEnvironment() {
    this.log('Generating coverage environment');

    try {
      this.sanityCheckContext();

      let files = shell.ls('-A', this.workingDir);
      const nmIndex = files.indexOf('node_modules');

      // Removes node_modules from array (unless requested).
      if (!this.copyNodeModules && nmIndex > -1) {
        files.splice(nmIndex, 1);
      }

      // Identify folders to exclude
      this.skipFiles.forEach(item => {
        if (path.extname(item) !== '.sol')
          this.skippedFolders.push(item);
      });

      files = files.map(file => `${this.workingDir}/${file}`);
      shell.mkdir(this.coverageDir);
      shell.cp('-R', files, this.coverageDir);

      // Add specific node_modules packages.
      if (!this.copyNodeModules && this.copyPackages.length) {
        shell.mkdir(this.coverageDir + '/node_modules');
        this.copyPackages.forEach((nodePackage) => {
          shell.cp('-rfL', 'node_modules/' + nodePackage, this.coverageDir + '/node_modules/');
        });
      }

      // Load config if present, accomodate common windows naming.
      let truffleConfig;

      shell.test('-e', `${this.workingDir}/truffle.js`)
          ? truffleConfig = reqCwd.silent(`${this.workingDir}/truffle.js`)
          : truffleConfig = reqCwd.silent(`${this.workingDir}/truffle-config.js`);

      // Coverage network opts specified: use port if declared
      if (truffleConfig && truffleConfig.networks && truffleConfig.networks.coverage) {
        this.port = truffleConfig.networks.coverage.port || this.port;
        this.network = '--network coverage';

      // No coverage network defaults to the dev network on port 8555, high gas / low price.
      } else {
        const trufflejs = defaultTruffleConfig(this.port, gasLimitHex, gasPriceHex);

        (process.platform === 'win32')
          ? fs.writeFileSync(`${this.coverageDir}/truffle-config.js`, trufflejs)
          : fs.writeFileSync(`${this.coverageDir}/truffle.js`, trufflejs);
      }

      // Compile the contracts before instrumentation and preserve their ABI's.
      // We will be stripping out access modifiers like view before we recompile
      // post-instrumentation.
      if (shell.test('-e', `${this.coverageDir}/build/contracts`)){
        shell.rm('-Rf', `${this.coverageDir}/build/contracts`)
      }

      this.runCompileCommand();
      this.originalArtifacts = this.loadArtifacts();
      shell.rm('-Rf', `${this.coverageDir}/build/contracts`);

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
   * + Save instrumented contract in the coverage environment folder where covered tests will run
   * + Add instrumentation info to the coverage map
   */
  instrumentTarget() {
    this.skipFiles = this.skipFiles.map(contract => `${this.coverageDir}/contracts/${contract}`);
    this.skipFiles.push(`${this.coverageDir}/contracts/Migrations.sol`);

    let currentFile;
    try {
      shell.ls(`${this.coverageDir}/contracts/**/*.sol`).forEach(file => {
        const contractPath = this.platformNeutralPath(file);
        const working = this.workingDir.substring(1);
        const canonicalPath = contractPath.split('/coverageEnv').join(working);
        const contract = fs.readFileSync(contractPath).toString();

        if (!this.skipFiles.includes(file) && !this.inSkippedFolder(file)) {
          this.log('Instrumenting ', file);
          currentFile = file;
          const instrumentedContractInfo = getInstrumentedVersion(contract, canonicalPath);
          fs.writeFileSync(contractPath, instrumentedContractInfo.contract);
          this.coverage.addContract(instrumentedContractInfo, canonicalPath);
        } else {
          this.log('Skipping instrumentation of ', file);
        }
      });
    } catch (err) {
      const msg = `There was a problem instrumenting ${currentFile}: `;
      this.cleanUp(msg + err);
    }
    this.postProcessPure(this.coverageDir);
  }

  /**
   *  Run modified testrpc with large block limit, on (hopefully) unused port.
   *  Changes here should be also be added to the before() block of test/run.js).
   *  @return {Promise} Resolves when testrpc prints 'Listening' to std out / norpc is true.
   */
  launchTestrpc() {
    return new Promise((resolve, reject) => {
      if (!this.norpc) {
        const defaultRpcOptions = `--accounts ${this.accounts} --port ${this.port}`;
        const options = (this.testrpcOptions || defaultRpcOptions) + ` --gasLimit ${gasLimitHex}`;
        const command = require.resolve('ethereumjs-testrpc-sc/build/cli.node.js');

        // Launch
        const execOpts = {maxBuffer: 1024 * 1024 * 10};
        this.testrpcProcess = childprocess.exec(`${command} ${options}`, execOpts, (err, stdout, stderr) => {
          if (err) {
            if (stdout) this.log(`testRpc stdout:\n${stdout}`);
            if (stderr) this.log(`testRpc stderr:\n${stderr}`);
            this.cleanUp('testRpc errored after launching as a childprocess.');
          }
        });

        // Resolve when testrpc logs that it's listening.
        this.testrpcProcess.stdout.on('data', data => {
          if (data.includes('Listening')) {
            this.log(`Launched testrpc on port ${this.port}`);
            return resolve();
          }
        });
      } else {
        return resolve();
      }
    });
  }

  /**
   *  Run truffle (or config.testCommand) over instrumented contracts in the
   *  coverage environment folder. Shell cd command needs to be invoked
   *  as its own statement for command line options to work, apparently.
   *  Also reads the 'allFiredEvents' log.
   */
  runTestCommand() {
    try {
      const defaultCommand = `truffle test ${this.network} ${this.silence}`;
      const command = this.testCommand || defaultCommand;
      this.log(`Running: ${command}\n(this can take a few seconds)...`);
      shell.cd(this.coverageDir);
      shell.exec(command);
      this.testsErrored = shell.error();
      shell.cd('./..');
    } catch (err) {
      const msg =
      `
        There was an error generating coverage. Possible reasons include:
        1. Another application is using port ${this.port}
        2. Your test runner (Truffle?) crashed because the tests encountered an error.

      `;
      this.cleanUp(msg + err);
    }
  }

  /**
   *  Run truffle compile (or config.compileCommand) over instrumented contracts in the
   *  coverage environment folder. Shell cd command needs to be invoked
   *  as its own statement for command line options to work, apparently.
   */
  runCompileCommand() {
    try {
      const defaultCommand = `truffle compile ${this.network} ${this.silence}`;
      const command = this.compileCommand || defaultCommand;
      this.log(`Running: ${command}\n(this can take a few seconds)...`);
      shell.cd(this.coverageDir);
      shell.exec(command);
      this.testsErrored = shell.error();
      shell.cd('./..');
    } catch (err) {
      const msg =
      `
        There was an error compiling the contracts.
      `;
      this.cleanUp(msg + err);
    }
  }

  /**
   * Loads artifacts generated by compiling the contracts before we instrument them.
   * @return {Array} Array of artifact objects
   */
  loadArtifacts() {
    const artifacts = [];

    shell.ls(`${this.coverageDir}/build/contracts/*.json`).forEach(file => {
      const artifactPath = this.platformNeutralPath(file);
      const artifactRaw = fs.readFileSync(artifactPath);
      const artifact = JSON.parse(artifactRaw);
      artifacts.push(artifact);
    })
    return artifacts;
  }

  /**
   * Swaps original ABIs into artifacts generated post-instrumentation. We are stripping
   * access modifiers like `view` out of the source during that step and need to ensure
   * truffle automatically invokes those methods by `.call`, based on the ABI sig.
   */
  modifyArtifacts(){
    shell.ls(`${this.coverageDir}/build/contracts/*.json`).forEach((file, index) => {
      const artifactPath = this.platformNeutralPath(file);
      const artifactRaw = fs.readFileSync(artifactPath);
      const artifact = JSON.parse(artifactRaw);
      artifact.abi = this.originalArtifacts[index].abi;
      fs.writeFileSync(artifactPath, JSON.stringify(artifact));
    })
  }

  /**
   * Generate coverage / write coverage report / run istanbul
   */
  generateReport() {
    const collector = new istanbul.Collector();
    const reporter = new istanbul.Reporter();

    return new Promise((resolve, reject) => {
      // Get events fired during instrumented contracts execution.
      const stream = fs.createReadStream(`./allFiredEvents`);
      stream.on('error', err => this.cleanUp('Event trace could not be read.\n' + err));
      const reader = readline.createInterface({
        input: stream,
      });
      this.events = [];
      reader
        .on('line', line => this.events.push(line))
        .on('close', () => {
          // Generate Istanbul report
          try {
            this.coverage.generate(this.events, `${this.workingDir}/contracts`);
            const relativeMapping = this.makeKeysRelative(this.coverage.coverage, this.workingDir);
            const json = JSON.stringify(relativeMapping);
            fs.writeFileSync('./coverage.json', json);

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
    });
  }

  // ------------------------------------------ Utils ----------------------------------------------

  sanityCheckContext(){
    if (!shell.test('-e', `${this.workingDir}/contracts`)){
      this.cleanUp("Couldn't find a 'contracts' folder to instrument.");
    }

    if (shell.test('-e', `${this.workingDir}/${this.coverageDir}`)){
      shell.rm('-Rf', this.coverageDir);
    }

    if (shell.test('-e', `${this.workingDir}/scTopics`)){
      shell.rm(`${this.workingDir}/scTopics`);
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
    Object.keys(map).forEach(pathKey => {
      newCoverage[path.relative(root, pathKey)] = map[pathKey];
    });
    return newCoverage;
  }

  /**
   * Conver absolute paths from Windows, if necessary
   * @param  {String} file path
   * @return {[type]}      normalized path
   */
  platformNeutralPath(file) {
    return (isWin)
      ? path.resolve(file).split('\\').join('/')
      : path.resolve(file);
  }

  /**
   * Determines if a file is in a folder marked skippable.
   * @param  {String} file file path
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
   * Replaces all occurences of `pure` and `view` modifiers in all .sols
   * in the coverageEnv before the `contracts` folder is instrumented.
   * @param  {String} env 'coverageEnv' presumably
   */
  postProcessPure(env) {
    shell.ls(`${env}/**/*.sol`).forEach(file => {
      const contractPath = this.platformNeutralPath(file);
      const contract = fs.readFileSync(contractPath).toString();
      const contractProcessed = preprocessor.run(contract);
      if (contractProcessed.name && contractProcessed.name === 'SyntaxError' && file.slice(-15) !== 'SimpleError.sol') {
        console.log(`Warning: The file at ${file} was identified as a Solidity Contract, ` +
         'but did not parse correctly. You may ignore this warning if it is not a Solidity file, ' +
         'or your project does not use it');
      } else {
        fs.writeFileSync(contractPath, contractProcessed);
      }
    });

    // First, compile the instrumented contracts
    this.runCompileCommand();

    // Now swap the original abis into the instrumented artifacts so that truffle etc uses 'call'
    // on them.
    this.modifyArtifacts();
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
    shell.rm('./allFiredEvents');
    shell.rm('./scTopics');

    if (self.testrpcProcess) {
      treeKill(self.testrpcProcess.pid, function(killError){
        self.log(`Shutting down testrpc-sc (pid ${self.testrpcProcess.pid})`)
        exit(err)
      });
    } else {
      exit(err);
    }
  }
}

module.exports = App;
