const assert = require('assert');
const fs = require('fs');
const shell = require('shelljs');
const mock = require('../util/integration.truffle');
const plugin = require('../../dist/truffle.plugin');
const util = require('util')
const opts = { compact: false, depth: 5, breakLength: 80 };

// =======
// Helpers
// =======
function pathExists(path) { return shell.test('-e', path); }

function assertCleanInitialState(){
  assert(pathExists('./coverage') === false, 'should start without: coverage');
  assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');
}

function assertCoverageGenerated(){
  assert(pathExists('./coverage') === true, 'should gen coverage folder');
  assert(pathExists('./coverage.json') === true, 'should gen coverage.json');
}

function assertCoverageNotGenerated(){
  assert(pathExists('./coverage') !== true, 'should NOT gen coverage folder');
  assert(pathExists('./coverage.json') !== true, 'should NOT gen coverage.json');
}

function getOutput(){
  return JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
}

// ========
// Tests
// ========
describe('app', function() {
  let truffleConfig;
  let solcoverConfig;

  beforeEach(() => {
    mock.clean();
    truffleConfig = mock.getDefaultTruffleConfig();
    solcoverConfig = {};

    if (process.env.SILENT)
      solcoverConfig.silent = true;
  })

  afterEach(() => mock.clean());

  it('simple contract: should generate coverage, cleanup & exit(0)', async function(){
    assertCleanInitialState();

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assertCoverageGenerated();

    const output = getOutput();
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

  it('project uses multiple migrations', async function() {
    assertCleanInitialState();
    mock.installFullProject('multiple-migrations');
    await plugin(truffleConfig);
  });

  it('project skips a folder', async function() {
    assertCleanInitialState();
    mock.installFullProject('skipping');
    await plugin(truffleConfig);
  });

  it.skip('project with node_modules packages and relative path solidity imports', async function() {
    assertCleanInitialState();
    mock.installFullProject('import-paths');
    await plugin(truffleConfig);
  });


  it('contract only uses ".call"', async function(){
    assertCleanInitialState();

    mock.install('OnlyCall', 'only-call.js', solcoverConfig);
    await plugin(truffleConfig);

    assertCoverageGenerated();

    const output = getOutput();
    const path = Object.keys(output)[0];
    assert(output[path].fnMap['1'].name === 'addTwo', 'cov should map "addTwo"');
  });

  it('contract sends / transfers to instrumented fallback', async function(){
    assertCleanInitialState();

    mock.install('Wallet', 'wallet.js', solcoverConfig);
    await plugin(truffleConfig);

    assertCoverageGenerated();

    const output = getOutput();
    const path = Object.keys(output)[0];
    assert(output[path].fnMap['1'].name === 'transferPayment', 'cov should map "transferPayment"');
  });

  it('contracts are skipped', async function() {
    assertCleanInitialState();

    solcoverConfig.skipFiles = ['Owned.sol'];

    mock.installDouble(['Proxy', 'Owned'], 'inheritance.js', solcoverConfig);
    await plugin(truffleConfig);

    assertCoverageGenerated();

    const output = getOutput();
    const firstKey = Object.keys(output)[0];
    assert(Object.keys(output).length === 1, 'Wrong # of contracts covered');
    assert(firstKey.substr(firstKey.length - 9) === 'Proxy.sol', 'Wrong contract covered');
  });

  it('contract uses inheritance', async function() {
    assertCleanInitialState();

    mock.installDouble(['Proxy', 'Owned'], 'inheritance.js', solcoverConfig);
    await plugin(truffleConfig);

    assertCoverageGenerated();

    const output = getOutput();
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

    assertCoverageGenerated();

    const output = getOutput();
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
      assert(err.message.includes('SyntaxError'));
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
      assert(err.message.includes('Compilation failed'));
    }

    assertCoverageNotGenerated();
  });

});
