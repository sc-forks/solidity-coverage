const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const argv = require('yargs').argv;
const childprocess = require('child_process');
const SolidityCoder = require('web3/lib/solidity/coder.js');
const getInstrumentedVersion = require('./instrumentSolidity.js');
const CoverageMap = require('./coverageMap.js');

const gasLimit = '0xfffffffffff';
const coverage = new CoverageMap();
const coverageDir = './coverageEnv';
//const _MODULES_ = 'node_modules/solcover/node_modules';
const _MODULES_ = 'node_modules';
let log = () => {};
let workingDir = './..';
let port = 8555;
let testrpcProcess = null;
let events = null;
let silence = '';

// --------------------------------------- Script --------------------------------------------------

if (argv.dir) workingDir = argv.dir;     // Working dir relative to solcover
if (argv.port) port = argv.port;         // Testrpc port

if (argv.silent) {                       // Log level
  silence = '> /dev/null 2>&1';
} else {
  log = console.log;
}

// Patch our local testrpc if necessary & Run the modified testrpc with large block limit,
// on (hopefully) unused port. Changes here should be also be added to the before() block
// of test/run.js
if (!argv.norpc) {
  if (!shell.test('-e', `./${_MODULES_}/ethereumjs-vm/lib/opFns.js.orig`)) {
    log('Patch local testrpc...');
    shell.exec(`patch -b ./${_MODULES_}/ethereumjs-vm/lib/opFns.js ./hookIntoEvents.patch`);
  }
  log(`Launching testrpc on port ${port}`);
  try {
    const command = `./${_MODULES_}/ethereumjs-testrpc/bin/testrpc --gasLimit ${gasLimit} --port ${port}`;
    testrpcProcess = childprocess.exec(command);
  } catch (err) {
    const msg = `There was a problem launching testrpc: ${err}`;
    cleanUp(msg);
  }
}
// Generate a copy of the target truffle project configured for solcover.
// NB: the following assumes that the target's truffle.js doesn't specify a custom build with an
// atypical directory structure or depend on the options solcover will change: port, gasLimit,
// gasPrice.
log('Generating coverage environment');

const truffleConfig = require(`${workingDir}/truffle.js`);
truffleConfig.networks.development.port = port;
truffleConfig.networks.development.gas = 0xfffffffffff;
truffleConfig.networks.development.gasPrice = 0x01;

shell.mkdir(`${coverageDir}`);
shell.cp('-R', `${workingDir}/contracts`, `${coverageDir}`);
shell.cp('-R', `${workingDir}/migrations`, `${coverageDir}`);
shell.cp('-R', `${workingDir}/test`, `${coverageDir}`);

fs.writeFileSync(`${coverageDir}/truffle.js`, `module.exports = ${JSON.stringify(truffleConfig)}`);

// For each contract in originalContracts, get the instrumented version
try {
  shell.ls(`${coverageDir}/contracts/**/*.sol`).forEach(file => {
    if (file !== `${coverageDir}/contracts/Migrations.sol`) {
      log('Instrumenting ', file);
      const canonicalContractPath = path.resolve(`${workingDir}/contracts/${path.basename(file)}`);
      const contract = fs.readFileSync(canonicalContractPath).toString();
      const instrumentedContractInfo = getInstrumentedVersion(contract, canonicalContractPath);
      fs.writeFileSync(`${coverageDir}/contracts/${path.basename(file)}`, instrumentedContractInfo.contract);
      coverage.addContract(instrumentedContractInfo, canonicalContractPath);
    }
  });
} catch (err) {
  cleanUp(err);
}

// Run truffle test on instrumented contracts
try {
  log('Launching Truffle (this can take a few seconds)...');
  const truffle = './../node_modules/truffle/cli.js';
  const command = `cd coverageEnv && ${truffle} test ${silence}`;
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

// Generate coverage, write coverage report / run istanbul
try {
  coverage.generate(events, `${coverageDir}/contracts/`);
  fs.writeFileSync('./coverage.json', JSON.stringify(coverage.coverage));
  shell.exec(`./${_MODULES_}/istanbul/lib/cli.js report lcov ${silence}`);
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
