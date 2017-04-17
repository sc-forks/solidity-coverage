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
const coverageDir = './coverageEnv';                   // Env that instrumented .sols are tested in
const solcoverDir = 'node_modules/solcover';           // Solcover assets
let modulesDir = 'node_modules/solcover/node_modules'; // Solcover's npm assets: configurable via test

// Options
let workingDir = '.';                       // Default location of contracts folder
let port = 8555;                            // Default port - NOT 8545 & configurable via --port
let coverageOption = '--network coverage';  // Default truffle network execution flag
let silence = '';                           // Default log level: configurable by --silence
let log = console.log;                      // Default log level: configurable by --silence

let testrpcProcess;                         // ref to testrpc server we need to close on exit
let events;                                 // ref to string loaded from 'allFiredEvents'

// --------------------------------------- Script --------------------------------------------------
const config = reqCwd.silent(`${workingDir}/.solcover.js`) || {};

if (config.dir) workingDir = config.dir;
if (config.port) port = config.port;
if (config.testing) modulesDir = 'node_modules';

if (config.silent) {
  silence = '> /dev/null 2>&1';       // Silence for solcover's unit tests / CI
  log = () => {};
}

// Run the modified testrpc with large block limit, on (hopefully) unused port.
// (Changes here should be also be added to the before() block of test/run.js).
if (!config.norpc) {
  try {
    log(`Launching testrpc on port ${port}`);
    const command = `./${modulesDir}/ethereumjs-testrpc/bin/testrpc `;
    const options = `--gasLimit ${gasLimitString} --port ${port}`;
    testrpcProcess = childprocess.exec(command + options);
  } catch (err) {
    const msg = `There was a problem launching testrpc: ${err}`;
    cleanUp(msg);
  }
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
  if (truffleConfig.networks.coverage){
    shell.cp(`${workingDir}/truffle.js`, `${coverageDir}/truffle.js`);

  // Coverage network opts NOT specified: default to the development network w/ modified
  // port, gasLimit, gasPrice. Export the config object only.
  } else {    
    truffleConfig.networks.development.port = port;
    truffleConfig.networks.development.gas = gasLimitHex;
    truffleConfig.networks.development.gasPrice = gasPriceHex;
    coverageOption = '';
    fs.writeFileSync(`${coverageDir}/truffle.js`, `module.exports = ${JSON.stringify(truffleConfig)}`);
  }
} catch (err){
  const msg = ('There was a problem generating the coverage environment: ');
  cleanUp(msg + err);
}

// For each contract except migrations.sol:
// 1. Generate file path reference for coverage report
// 2. Load contract as string
// 3. Instrument contract
// 4. Save instrumented contract in the coverage environment folder where covered tests will run
// 5. Add instrumentation info to the coverage map
try {
  shell.ls(`${coverageDir}/contracts/**/*.sol`).forEach(file => {
    const migrations = `${coverageDir}/contracts/Migrations.sol`;

    if (file !== migrations) {
      log('Instrumenting ', file);
      const contractPath = path.resolve(file);
      const contract = fs.readFileSync(contractPath).toString();
      const instrumentedContractInfo = getInstrumentedVersion(contract, contractPath);
  
      fs.writeFileSync(contractPath, instrumentedContractInfo.contract);
      coverage.addContract(instrumentedContractInfo, contractPath);
    }
  });
} catch (err) {
  cleanUp(err);
}

// Run solcover's fork of truffle over instrumented contracts in the
// coverage environment folder
try {
  log('Launching Truffle (this can take a few seconds)...');
  const truffle = `./../${modulesDir}/truffle/cli.js`;
  const command = `cd coverageEnv && ${truffle} test ${coverageOption} ${silence}`;
  shell.exec(command);
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
  coverage.generate(events, `${coverageDir}/contracts/`);
  
  const json = JSON.stringify(coverage.coverage);
  fs.writeFileSync('./coverage.json', json);

  istanbulCollector.add(coverage.coverage);
  istanbulReporter.addAll([ 'lcov', 'html' ]);
  istanbulReporter.write(istanbulCollector, false, () => {
      log('Istanbul coverage reports generated');
  });

} catch (err) {
  const msg = 'There was a problem generating producing the coverage map / running Istanbul.\n';
  cleanUp(msg + err);
}

// Finish
cleanUp();

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
