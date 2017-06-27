#!/usr/bin/env node

const shell = require('shelljs');
const fs = require('fs');
const reqCwd = require('req-cwd');
const path = require('path');
const childprocess = require('child_process');
const istanbul = require('istanbul');
const getInstrumentedVersion = require('./../lib/instrumentSolidity.js');
const CoverageMap = require('./../lib/coverageMap.js');

const istanbulCollector = new istanbul.Collector();
const istanbulReporter = new istanbul.Reporter();

// Very high gas block limits / contract deployment limits
const gasLimitString = '0xfffffffffff';
const gasLimitHex = 0xfffffffffff;
const gasPriceHex = 0x01;

const coverage = new CoverageMap();

// Paths
const coverageDir = './coverageEnv';        // Env that instrumented .sols are tested in

// Options
let coverageOption = '--network coverage';  // Default truffle network execution flag
let silence = '';                           // Default log level: configurable by --silence
let log = console.log;

let testrpcProcess;                         // ref to testrpc server we need to close on exit
let events;                                 // ref to string loaded from 'allFiredEvents'
let testsErrored = null;                    // flag set to non-null if truffle tests error

// --------------------------------------- Utilities -----------------------------------------------
/**
 * Removes coverage build artifacts, kills testrpc.
 * Exits (1) and prints msg on error, exits (0) otherwise.
 * @param  {String} err error message
 */
function cleanUp(err) {
  log('Cleaning up...');
  shell.config.silent = true;
  shell.rm('-Rf', `${coverageDir}`);
  shell.rm('./allFiredEvents');
  shell.rm('./scTopics');
  if (testrpcProcess) { testrpcProcess.kill(); }

  if (err) {
    log(`${err}\nExiting without generating coverage...`);
    process.exit(1);
  } else if (testsErrored) {
    log('Some truffle tests failed while running coverage');
    process.exit(1);
  } else {
    process.exit(0);
  }
}
// --------------------------------------- Script --------------------------------------------------
const config = reqCwd.silent('./.solcover.js') || {};

const workingDir = config.dir || '.';       // Relative path to contracts folder
let port = config.port || 8555;             // Port testrpc listens on
const accounts = config.accounts || 35;     // Number of accounts to testrpc launches with
const copyNodeModules = config.copyNodeModules || false; // Whether we copy node_modules when making coverage environment

// Silence shell and script logging (for solcover's unit tests / CI)
if (config.silent) {
  silence = '> /dev/null 2>&1';
  log = () => {};
}

// Generate a copy of the target project configured for solcover and save to the coverage
// environment folder.
log('Generating coverage environment');
try {
  let files = shell.ls(workingDir);
  const nmIndex = files.indexOf('node_modules');

  if (!config.copyNodeModules && nmIndex > -1) {
    files.splice(nmIndex, 1); // Removes node_modules from array.
  }

  files = files.map(file => `${workingDir}/` + file);
  shell.mkdir(coverageDir);
  shell.cp('-R', files, coverageDir);

  const truffleConfig = reqCwd.silent(`${workingDir}/truffle.js`);

  // Coverage network opts specified: use port if declared
  if (truffleConfig && truffleConfig.networks && truffleConfig.networks.coverage) {
    port = truffleConfig.networks.coverage.port || port;
   
  // Coverage network opts NOT specified: default to the development network w/ modified
  // port, gasLimit, gasPrice. Export the config object only.
  } else {
    const trufflejs = `
      module.exports = {
        networks: {
          development: {
            host: "localhost",
            network_id: "*",
            port: ${port},
            gas: ${gasLimitHex},
            gasPrice: ${gasPriceHex}
          }
        }
      };`;

    coverageOption = '';
    fs.writeFileSync(`${coverageDir}/truffle.js`, trufflejs);
  }
} catch (err) {
  const msg = ('There was a problem generating the coverage environment: ');
  cleanUp(msg + err);
}

// For each contract except migrations.sol:
// 1. Generate file path reference for coverage report
// 2. Load contract as string
// 3. Instrument contract
// 4. Save instrumented contract in the coverage environment folder where covered tests will run
// 5. Add instrumentation info to the coverage map
let currentFile;
try {
  shell.ls(`${coverageDir}/contracts/**/*.sol`).forEach(file => {
    const migrations = `${coverageDir}/contracts/Migrations.sol`;

    if (file !== migrations) {
      log('Instrumenting ', file);
      currentFile = file;

      const contractPath = path.resolve(file);
      const canonicalPath = contractPath.split('/coverageEnv').join('');
      const contract = fs.readFileSync(contractPath).toString();
      const instrumentedContractInfo = getInstrumentedVersion(contract, canonicalPath);
      fs.writeFileSync(contractPath, instrumentedContractInfo.contract);
      coverage.addContract(instrumentedContractInfo, canonicalPath);
    }
  });
} catch (err) {
  const msg = (`There was a problem instrumenting ${currentFile}: `);
  cleanUp(msg + err);
}

// Run modified testrpc with large block limit, on (hopefully) unused port.
// (Changes here should be also be added to the before() block of test/run.js).
if (!config.norpc) {
  const defaultRpcOptions = `--gasLimit ${gasLimitString} --accounts ${accounts} --port ${port}`;
  const testrpcOptions = config.testrpcOptions || defaultRpcOptions;
  const command = './node_modules/ethereumjs-testrpc-sc/bin/testrpc ';

  testrpcProcess = childprocess.exec(command + testrpcOptions, null, err => {
    if (err) cleanUp('testRpc errored after launching as a childprocess.');
  });
  log(`Launching testrpc on port ${port}`);
}

// Run truffle (or config.testCommand) over instrumented contracts in the
// coverage environment folder. Shell cd command needs to be invoked
// as its own statement for command line options to work, apparently.
try {
  log('Launching test command (this can take a few seconds)...');
  const defaultCommand = `truffle test ${coverageOption} ${silence}`;
  const command = config.testCommand || defaultCommand;
  shell.cd('./coverageEnv');
  shell.exec(command);
  testsErrored = shell.error();
  shell.cd('./..');
} catch (err) {
  cleanUp(err);
}

// Get events fired during instrumented contracts execution.
try {
  events = fs.readFileSync('./allFiredEvents').toString().split('\n');
  events.pop();
} catch (err) {
  const msg =
  `
    There was an error generating coverage. Possible reasons include:
    1. Another application is using port ${port}
    2. Truffle crashed because your tests errored

  `;
  cleanUp(msg + err);
}

// Generate coverage / write coverage report / run istanbul
try {
  coverage.generate(events, './contracts');

  const json = JSON.stringify(coverage.coverage);
  fs.writeFileSync('./coverage.json', json);

  istanbulCollector.add(coverage.coverage);
  istanbulReporter.add('html');
  istanbulReporter.add('lcov');
  istanbulReporter.add('text');
  istanbulReporter.write(istanbulCollector, true, () => {
    log('Istanbul coverage reports generated');
  });
} catch (err) {
  if (config.testing) {
    cleanUp();
  } else {
    const msg = 'There was a problem generating producing the coverage map / running Istanbul.\n';
    cleanUp(msg + err);
  }
}

// Finish
cleanUp();
