const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const childprocess = require('child_process');
const reqCwd = require('req-cwd');
const istanbul = require('istanbul');
const getInstrumentedVersion = require('./instrumentSolidity.js');
const CoverageMap = require('./coverageMap.js');
const defaultTruffleConfig = require('./truffleConfig.js');

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

    // Config
    this.config = config || {};
    this.workingDir = config.dir || '.';         // Relative path to contracts folder
    this.accounts = config.accounts || 35;       // Number of accounts to testrpc launches with
    this.skipFiles = config.skipFiles || [];     // Which files should be skipped during instrumentation
    this.norpc = config.norpc || false;          // Launch testrpc-sc internally?
    this.port = config.port || 8555;             // Port testrpc should listen on

    this.copyNodeModules = config.copyNodeModules || false;  // Copy node modules into coverageEnv?
    this.testrpcOptions = config.testrpcOptions || null;     // Options for testrpc-sc
    this.testCommand = config.testCommand || null;           // Optional test command

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
      let files = shell.ls(this.workingDir);
      const nmIndex = files.indexOf('node_modules');

      // Removes node_modules from array (unless requested).
      if (!this.copyNodeModules && nmIndex > -1) {
        files.splice(nmIndex, 1);
      }

      files = files.map(file => `${this.workingDir}/${file}`);
      shell.mkdir(this.coverageDir);
      shell.cp('-R', files, this.coverageDir);

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
        if (!this.skipFiles.includes(file)) {
          this.log('Instrumenting ', file);
          currentFile = file;

          const contractPath = path.resolve(file);
          const working = this.workingDir.substring(1);
          const canonicalPath = contractPath.split('/coverageEnv').join(working);
          const contract = fs.readFileSync(contractPath).toString();
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
  }

  /**
   *  Run modified testrpc with large block limit, on (hopefully) unused port.
   *  Changes here should be also be added to the before() block of test/run.js).
   *  @return {Promise} Resolves when testrpc prints 'Listening' to std out / norpc is true.
   */
  launchTestrpc() {
    return new Promise((resolve, reject) => {
      if (!this.norpc) {
        let command;

        const defaultRpcOptions = `--gasLimit ${gasLimitHex} --accounts ${this.accounts} --port ${this.port}`;
        const options = this.testrpcOptions || defaultRpcOptions;
        const npm = './node_modules/.bin/testrpc-sc';
        const yarn = './node_modules/ethereumjs-testrpc-sc/build/cli.node.js';
      
        shell.test('-e', yarn)
          ? command = `${yarn} `
          : command = `${npm} `;
  
        // Launch
        this.testrpcProcess = childprocess.exec(command + options, null, (err, stdout, stderr) => {
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
      this.cleanUp(err);
    }

    // Get events fired during instrumented contracts execution.
    try {
      this.events = fs.readFileSync('./allFiredEvents').toString().split('\n');
      this.events.pop();
    } catch (err) {
      const msg =
      `
        There was an error generating coverage. Possible reasons include:
        1. Another application is using port ${this.port}
        2. Truffle crashed because your tests errored

      `;
      this.cleanUp(msg + err);
    }
  }

  /**
   * Generate coverage / write coverage report / run istanbul
   */
  generateReport() {
    const collector = new istanbul.Collector();
    const reporter = new istanbul.Reporter();

    return new Promise((resolve, reject) => {
      try {
        this.coverage.generate(this.events, `${this.workingDir}/contracts`);

        const json = JSON.stringify(this.coverage.coverage);
        fs.writeFileSync('./coverage.json', json);

        collector.add(this.coverage.coverage);
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
        this.cleanUp(msg + err);
      }
    });
  }

  // ------------------------------------------ Utils ----------------------------------------------

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
    this.log('Cleaning up...');
    shell.config.silent = true;
    shell.rm('-Rf', this.coverageDir);
    shell.rm('./allFiredEvents');
    shell.rm('./scTopics');
    if (this.testrpcProcess) { this.testrpcProcess.kill(); }

    if (err) {
      this.log(`${err}\nExiting without generating coverage...`);
      process.exit(1);
    } else if (this.testsErrored) {
      this.log('Some truffle tests failed while running coverage');
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

module.exports = App;
