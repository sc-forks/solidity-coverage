const assert = require('assert');
const fs = require('fs');
const shell = require('shelljs');
const mock = require('../util/integration.truffle');
const plugin = require('../../dist/truffle.plugin');
const path = require('path')
const util = require('util')
const opts = { compact: false, depth: 5, breakLength: 80 };

// =======
// Helpers
// =======
function pathExists(path) { return shell.test('-e', path); }

function pathToContract(config, file) {
  return path.join('contracts', file);
}

function assertLineCoverage(expected=[]){
  let summary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json'));
  expected.forEach(item => assert(summary[item.file].lines.pct === item.pct))
}

function assertCoverageMissing(expected=[]){
  let summary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json'));
  expected.forEach(item => assert(summary[item.file] === undefined))
}

function assertCleanInitialState(){
  assert(pathExists('./coverage') === false, 'should start without: coverage');
  assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');
}

function assertCoverageGenerate(truffleConfig){
  const jsonPath = path.join(truffleConfig.working_directory, "coverage.json");
  assert(pathExists('./coverage') === true, 'should gen coverage folder');
  assert(pathExists(jsonPath) === true, 'should gen coverage.json');
}

function assertCoverageNotGenerated(truffleConfig){
  const jsonPath = path.join(truffleConfig.working_directory, "coverage.json");
  assert(pathExists('./coverage') !== true, 'should NOT gen coverage folder');
  assert(pathExists(jsonPath) !== true, 'should NOT gen coverage.json');
}

function getOutput(truffleConfig){
  const jsonPath = path.join(truffleConfig.working_directory, "coverage.json");
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

// ========
// Tests
// ========
describe.only('app', function() {
  let truffleConfig;
  let solcoverConfig;
  let collector;

  beforeEach(() => {
    mock.clean();

    mock.loggerOutput.val = '';
    solcoverConfig = {};
    truffleConfig = mock.getDefaultTruffleConfig();
  })

  afterEach(() => mock.clean());

  it('simple contract: should generate coverage, cleanup & exit(0)', async function(){
    assertCleanInitialState();

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assertCoverageGenerate(truffleConfig);

    const output = getOutput(truffleConfig);
    const path = Object.keys(output)[0];

    assert(output[path].fnMap['1'].name === 'test', 'coverage.json missing "test"');
    assert(output[path].fnMap['2'].name === 'getX', 'coverage.json missing "getX"');
  });

  // Truffle test asserts balance is 777 ether
  it('config with providerOptions', async function() {
    solcoverConfig.providerOptions = { default_balance_ether: 777 }

    mock.install('Simple', 'testrpc-options.js', solcoverConfig);
    await plugin(truffleConfig);
  });

  it('large contract with many unbracketed statements (time check)', async function() {
    assertCleanInitialState();

    truffleConfig.compilers.solc.version = "0.4.24";

    mock.install('Oraclize', 'oraclize.js', solcoverConfig, truffleConfig, true);
    await plugin(truffleConfig);
  });

  // This project has three contract suites and uses .deployed() instances which
  // depend on truffle's migratons and the inter-test evm_revert / evm_snapshot mechanism.
  it('project evm_reverts repeatedly', async function() {
    assertCleanInitialState();
    mock.installFullProject('multiple-migrations');
    await plugin(truffleConfig);

    const expected = [
      {
        file: pathToContract(truffleConfig, 'ContractA.sol'),
        pct: 100
      },
      {
        file: pathToContract(truffleConfig, 'ContractB.sol'),
        pct: 100,
      },
      {
        file: pathToContract(truffleConfig, 'ContractC.sol'),
        pct: 100,
      },
    ];

    assertLineCoverage(expected);
  });

  it('project skips a folder', async function() {
    assertCleanInitialState();
    mock.installFullProject('skipping');
    await plugin(truffleConfig);

    const expected = [{
     file: pathToContract(truffleConfig, 'ContractA.sol'),
     pct: 100
    }];

    const missing = [{
     file: pathToContract(truffleConfig, 'ContractB.sol'),
    }];

    assertLineCoverage(expected);
    assertCoverageMissing(missing);
  });

  it('project contains no contract sources folder', async function() {
    assertCleanInitialState();
    mock.installFullProject('no-sources');

    try {
      await plugin(truffleConfig);
      assert.fail()
    } catch(err){
      assert(
        err.message.includes('Cannot locate expected contract sources folder'),
        `Should error when contract sources cannot be found: (output --> ${err.message}`
      );

      assert(
        err.message.includes('sc_temp/contracts'),
        `Error message should contain path: (output --> ${err.message}`
      );
    }

    assertCoverageNotGenerated(truffleConfig);
  });

  it('project with relative path solidity imports', async function() {
    assertCleanInitialState();
    mock.installFullProject('import-paths');
    await plugin(truffleConfig);
  });

  it('project contains native solidity tests', async function(){
    assertCleanInitialState();

    mock.install('Simple', 'TestSimple.sol', solcoverConfig);

    truffleConfig.logger = mock.testLogger;
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('native solidity tests'),
      `Should warn it is skipping native solidity tests (output --> ${mock.loggerOutput.val}`
    );
  });

  it('truffle run coverage --config ../.solcover.js', async function() {
    assertCleanInitialState();

    solcoverConfig = {
      silent: process.env.SILENT ? true : false,
      istanbulReporter: ['json-summary', 'text']
    };
    fs.writeFileSync('.solcover.js', `module.exports=${JSON.stringify(solcoverConfig)}`);

    // This relative path has to be ./ prefixed
    // (because it's path.joined to truffle's working_directory)
    truffleConfig.solcoverjs = './../.solcover.js';

    mock.install('Simple', 'simple.js');
    await plugin(truffleConfig);

    // The relative solcoverjs uses the json-summary reporter which
    // this assertion requires
    const expected = [{
      file: pathToContract(truffleConfig, 'Simple.sol'),
      pct: 100
    }];

    assertLineCoverage(expected);
    shell.rm('.solcover.js');
  });

  it('truffle run coverage --help', async function(){
    assertCleanInitialState();
    truffleConfig.help = "true";

    truffleConfig.logger = mock.testLogger;
    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('Usage'),
      `Should output help with Usage instruction  (output --> ${mock.loggerOutput.val}`
    );
  })

  it('truffle run coverage --version', async function(){
    assertCleanInitialState();
    truffleConfig.version = "true";

    truffleConfig.logger = mock.testLogger;
    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('truffle'),
      `Should output truffle version (output --> ${mock.loggerOutput.val}`
    );

    assert(
      mock.loggerOutput.val.includes('ganache-core'),
      `Should output ganache-core version (output --> ${mock.loggerOutput.val}`
    );

    assert(
      mock.loggerOutput.val.includes('solidity-coverage'),
      `Should output solidity-coverage version (output --> ${mock.loggerOutput.val}`
    );

  })

  it('truffle run coverage --useGlobalTruffle', async function(){
    assertCleanInitialState();
    truffleConfig.useGlobalTruffle = true;

    truffleConfig.logger = mock.testLogger;
    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('global node_modules'),
      `Should notify it's using global truffle (output --> ${mock.loggerOutput.val}`
    );
  });

  it('truffle run coverage --usePluginTruffle', async function(){
    assertCleanInitialState();
    truffleConfig.usePluginTruffle = true;

    truffleConfig.logger = mock.testLogger;
    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('fallback Truffle library module'),
      `Should notify it's using plugin truffle lib copy (output --> ${mock.loggerOutput.val}`
    );
  });

  it('lib module load failure', async function(){
    assertCleanInitialState();
    truffleConfig.usePluginTruffle = true;
    truffleConfig.forceLibFailure = true;

    mock.install('Simple', 'simple.js', solcoverConfig);

    try {
      await plugin(truffleConfig);
      assert.fail()
    } catch (err) {
      assert(
        err.message.includes('Unable to load plugin copy of Truffle library module'),
        `Should error on failed lib module load (output --> ${err.message}`
      );
    }
  });

  it('truffle run coverage --file test/<fileName>', async function() {
    assertCleanInitialState();

    const testPath = path.join(truffleConfig.working_directory, 'test/specific_a.js');
    truffleConfig.file = testPath;
    mock.installFullProject('test-files');
    await plugin(truffleConfig);

    const expected = [
      {
        file: pathToContract(truffleConfig, 'ContractA.sol'),
        pct: 100
      },
      {
        file: pathToContract(truffleConfig, 'ContractB.sol'),
        pct: 0,
      },
      {
        file: pathToContract(truffleConfig, 'ContractC.sol'),
        pct: 0,
      },
    ];

    assertLineCoverage(expected);
  });

  it('truffle run coverage --file test/<glob*>', async function() {
    assertCleanInitialState();

    const testPath = path.join(truffleConfig.working_directory, 'test/globby*');
    truffleConfig.file = testPath;
    mock.installFullProject('test-files');
    await plugin(truffleConfig);

    const expected = [
      {
        file: pathToContract(truffleConfig, 'ContractA.sol'),
        pct: 0,
      },
      {
        file: pathToContract(truffleConfig, 'ContractB.sol'),
        pct: 100,
      },
      {
        file: pathToContract(truffleConfig, 'ContractC.sol'),
        pct: 100,
      },
    ];

    assertLineCoverage(expected);
  });

  it('truffle run coverage --file test/gl{o,b}*.js', async function() {
    assertCleanInitialState();

    const testPath = path.join(truffleConfig.working_directory, 'test/gl{o,b}*.js');
    truffleConfig.file = testPath;
    mock.installFullProject('test-files');
    await plugin(truffleConfig);

    const expected = [
      {
        file: pathToContract(truffleConfig, 'ContractA.sol'),
        pct: 0,
      },
      {
        file: pathToContract(truffleConfig, 'ContractB.sol'),
        pct: 100,
      },
      {
        file: pathToContract(truffleConfig, 'ContractC.sol'),
        pct: 100,
      },
    ];

    assertLineCoverage(expected);
  });

  it('contract only uses ".call"', async function(){
    assertCleanInitialState();

    mock.install('OnlyCall', 'only-call.js', solcoverConfig);
    await plugin(truffleConfig);

    assertCoverageGenerate(truffleConfig);

    const output = getOutput(truffleConfig);
    const path = Object.keys(output)[0];
    assert(output[path].fnMap['1'].name === 'addTwo', 'cov should map "addTwo"');
  });

  it('contract sends / transfers to instrumented fallback', async function(){
    assertCleanInitialState();

    mock.install('Wallet', 'wallet.js', solcoverConfig);
    await plugin(truffleConfig);

    assertCoverageGenerate(truffleConfig);

    const output = getOutput(truffleConfig);
    const path = Object.keys(output)[0];
    assert(output[path].fnMap['1'].name === 'transferPayment', 'cov should map "transferPayment"');
  });

  it('contracts are skipped', async function() {
    assertCleanInitialState();

    solcoverConfig.skipFiles = ['Owned.sol'];

    mock.installDouble(['Proxy', 'Owned'], 'inheritance.js', solcoverConfig);
    await plugin(truffleConfig);

    assertCoverageGenerate(truffleConfig);

    const output = getOutput(truffleConfig);
    const firstKey = Object.keys(output)[0];
    assert(Object.keys(output).length === 1, 'Wrong # of contracts covered');
    assert(firstKey.substr(firstKey.length - 9) === 'Proxy.sol', 'Wrong contract covered');
  });

  it('contract uses inheritance', async function() {
    assertCleanInitialState();

    mock.installDouble(['Proxy', 'Owned'], 'inheritance.js', solcoverConfig);
    await plugin(truffleConfig);

    assertCoverageGenerate(truffleConfig);

    const output = getOutput(truffleConfig);
    const ownedPath = Object.keys(output)[0];
    const proxyPath = Object.keys(output)[1];
    assert(output[ownedPath].fnMap['1'].name === 'constructor', '"constructor" not covered');
    assert(output[proxyPath].fnMap['1'].name === 'isOwner', '"isOwner" not covered');
  });

  // Simple.sol with a failing assertion in a truffle test
  it('truffle tests failing', async function() {
    assertCleanInitialState();

    mock.install('Simple', 'truffle-test-fail.js', solcoverConfig);

    try {
      await plugin(truffleConfig);
      assert.fail()
    } catch(err){
      assert(err.message.includes('failed under coverage'));
    }

    assertCoverageGenerate(truffleConfig);

    const output = getOutput(truffleConfig);
    const path = Object.keys(output)[0];

    assert(output[path].fnMap['1'].name === 'test', 'cov missing "test"');
    assert(output[path].fnMap['2'].name === 'getX', 'cov missing "getX"');
  });

  // Truffle test asserts deployment cost is greater than 20,000,000 gas
  it('deployment cost > block gasLimit', async function() {
    mock.install('Expensive', 'block-gas-limit.js', solcoverConfig);
    await plugin(truffleConfig);
  });

  // Truffle test contains syntax error
  it('truffle crashes', async function() {
    assertCleanInitialState();

    mock.install('Simple', 'truffle-crash.js', solcoverConfig);
    try {
      await plugin(truffleConfig);
      assert.fail()
    } catch(err){
      assert(err.toString().includes('SyntaxError'));
    }
  });

  // Solidity syntax errors
  it('compilation failure', async function(){
    assertCleanInitialState();

    mock.install('SimpleError', 'simple.js', solcoverConfig);

    try {
      await plugin(truffleConfig);
      assert.fail()
    } catch(err){
      assert(err.toString().includes('Compilation failed'));
    }

    assertCoverageNotGenerated(truffleConfig);
  });

  it('instrumentation failure', async function(){
    assertCleanInitialState();

    mock.install('Unparseable', 'simple.js', solcoverConfig);

    try {
      await plugin(truffleConfig);
      assert.fail()
    } catch(err){
      assert(
        err.toString().includes('/Unparseable.sol.'),
        `Should throw instrumentation errors with file name (output --> ${err.toString()}`
      );

      assert(err.stack !== undefined, 'Should have error trace')
    }

    assertCoverageNotGenerated(truffleConfig);
  })

});
