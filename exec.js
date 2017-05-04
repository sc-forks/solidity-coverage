#!/usr/bin/env node

const shell = require('shelljs');
const fs = require('fs');
const reqCwd = require('req-cwd');
const path = require('path');
const childprocess = require('child_process');
const getInstrumentedVersion = require('./instrumentSolidity.js');
const CoverageMap = require('./coverageMap.js');
const istanbul = require('istanbul');

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
let log = console.log;                      // Default log level: configurable by --silence

let testrpcProcess;                         // ref to testrpc server we need to close on exit
let events;                                 // ref to string loaded from 'allFiredEvents'

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
  if (testrpcProcess) { testrpcProcess.kill(); }

  if (err) {
    log(`${err}\nExiting without generating coverage...`);
    process.exit(1);
  } else {
    process.exit(0);
  }
}
// --------------------------------------- Script --------------------------------------------------
const config = reqCwd.silent('./.solcover.js') || {};

const workingDir = config.dir || '.';    // Relative path to contracts folder
const port = config.port || 8555;        // Port testrpc listens on
const accounts = config.accounts || 35;  // Number of accounts to testrpc launches with

// Set testrpc options
const defaultRpcOptions = `--gasLimit ${gasLimitString} --accounts ${accounts} --port ${port}`;
const testrpcOptions = config.testrpcOptions || defaultRpcOptions;

// Silence shell and script logging (for solcover's unit tests / CI)
if (config.silent) {
  silence = '> /dev/null 2>&1';
  log = () => {};
}

// Run modified testrpc with large block limit, on (hopefully) unused port.
// (Changes here should be also be added to the before() block of test/run.js).
if (!config.norpc) {
  const command = './node_modules/.bin/testrpc-sc ';
  testrpcProcess = childprocess.exec(command + testrpcOptions, null, (err) => {
    if (err) cleanUp('testRpc errored after launching as a childprocess.');
  });
  log(`Launching testrpc on port ${port}`);
}

// Generate a copy of the target truffle project configured for solcover and save to the coverage
// environment folder.
log('Generating coverage environment');
try {
  shell.mkdir(`${coverageDir}`);
  shell.cp('-R', `${workingDir}/contracts`, `${coverageDir}`);
  shell.cp('-R', `${workingDir}/migrations`, `${coverageDir}`);
  shell.cp('-R', `${workingDir}/test`, `${coverageDir}`);

  const truffleConfig = reqCwd(`${workingDir}/truffle.js`);

  // Coverage network opts specified: copy truffle.js whole to coverage environment
  if (truffleConfig.networks.coverage) {
    shell.cp(`${workingDir}/truffle.js`, `${coverageDir}/truffle.js`);

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

// Run solcover's fork of truffle over instrumented contracts in the
// coverage environment folder. Shell cd command needs to be invoked
// as its own statement for command line options to work, apparently.
try {
  log('Launching test command (this can take a few seconds)...');
  const defaultCommand = `truffle test ${coverageOption} ${silence}`;
  const command = config.testCommand || defaultCommand;
  shell.cd('./coverageEnv');
  shell.exec(command);
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
