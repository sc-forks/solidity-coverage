const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const argv = require('yargs').argv;
const childprocess = require('child_process');
const SolidityCoder = require('web3/lib/solidity/coder.js');
const getInstrumentedVersion = require('./instrumentSolidity.js');
const CoverageMap = require('./coverageMap.js');

// Very high gas block limits / contract deployment limits
const gasLimitString = '0xfffffffffff';
const gasLimitHex = 0xfffffffffff;
const gasPriceHex = 0x01;

const coverage = new CoverageMap();

// Paths
const coverageDir = './coverageEnv';                   // Env that instrumented .sols are tested in
const solcoverDir = 'node_modules/solcover'            // Solcover assets
let modulesDir = 'node_modules/solcover/node_modules'; // Solcover's npm assets: configurable via test


let workingDir = '.';                 // Default location of contracts folder
let port = 8555;                      // Default port - NOT 8545 & configurable via --port
let silence = '';                     // Default log level: configurable by --silence 
let log = console.log;                // Default log level: configurable by --silence 

let testrpcProcess;                   // ref to testrpc process we need to kill on exit
let events;                           // ref to string loaded from 'allFiredEvents'

// --------------------------------------- Script --------------------------------------------------

if (argv.dir) workingDir = argv.dir;     
if (argv.port) port = argv.port;  
if (argv.testing) modulesDir = 'node_modules'; 

if (argv.silent) {                       
  silence = '> /dev/null 2>&1';       // Silence for solcover's unit tests / CI
  log = () => {}
} 

// Run the modified testrpc with large block limit, on (hopefully) unused port. 
// (Changes here should be also be added to the before() block of test/run.js).
if (!argv.norpc) {
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
// 
// NB: this code assumes that truffle test can run successfully on the development network defaults 
// and doesn't otherwise depend on the options solcover will change: port, gasLimit,
// gasPrice.
log('Generating coverage environment');

const truffleConfig = require(`${workingDir}/truffle.js`);
truffleConfig.networks.development.port = port;
truffleConfig.networks.development.gas = gasLimitHex;
truffleConfig.networks.development.gasPrice = gasPriceHex;

shell.mkdir(`${coverageDir}`);
shell.cp('-R', `${workingDir}/contracts`, `${coverageDir}`);
shell.cp('-R', `${workingDir}/migrations`, `${coverageDir}`);
shell.cp('-R', `${workingDir}/test`, `${coverageDir}`);

fs.writeFileSync(`${coverageDir}/truffle.js`, `module.exports = ${JSON.stringify(truffleConfig)}`);

// For each contract except migrations.sol:
// 1. Generate reference to its real path (this identifies it in the reports)
// 2. Load contract as string
// 3. Instrument contract
// 4. Save instrumented contract in the coverage environment folder where covered tests will run
// 5. Add instrumentation info to the coverage map
try {
  shell.ls(`${coverageDir}/contracts/**/*.sol`).forEach(file => {
    let migrations = `${coverageDir}/contracts/Migrations.sol`;
    
    if (file !== migrations) {
      log('Instrumenting ', file);  
      const canonicalContractPath = path.resolve(`${workingDir}/contracts/${path.basename(file)}`);
      const contract = fs.readFileSync(canonicalContractPath).toString();
      const instrumentedContractInfo = getInstrumentedVersion(contract, canonicalContractPath);
      const instrumentedFilePath = `${coverageDir}/contracts/${path.basename(file)}`
      
      fs.writeFileSync(instrumentedFilePath, instrumentedContractInfo.contract);
      coverage.addContract(instrumentedContractInfo, canonicalContractPath);
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
  const command = `cd coverageEnv && ${truffle} test ${silence}`;
  shell.exec(command);
} catch (err) {
  cleanUp(err);
}

// Get events fired during instrumented contracts execution.
try {
  events = fs.readFileSync(`./allFiredEvents`).toString().split('\n');
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
  let json;
  let istanbul = `./${modulesDir}/istanbul/lib/cli.js report lcov ${silence}`
  
  coverage.generate(events, `${coverageDir}/contracts/`);
  json = JSON.stringify(coverage.coverage);
  fs.writeFileSync(`./coverage.json`, json);
  shell.exec(istanbul);

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
  shell.rm(`./allFiredEvents`);
  if (testrpcProcess) { testrpcProcess.kill(); }

  if (err) {
    log(`${err}\nExiting without generating coverage...`);
    process.exit(1);
  } else {
    process.exit(0);
  }
}
