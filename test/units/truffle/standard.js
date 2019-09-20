const assert = require('assert');
const fs = require('fs');
const path = require('path')
const shell = require('shelljs');

const verify = require('../../util/verifiers')
const mock = require('../../util/integration.truffle');
const plugin = require('../../../dist/truffle.plugin');

// =======================
// Standard Use-case Tests
// =======================

describe('Truffle Plugin: standard use cases', function() {
  let truffleConfig;
  let solcoverConfig;

  beforeEach(() => {
    mock.clean();

    mock.loggerOutput.val = '';
    solcoverConfig = {};
    truffleConfig = mock.getDefaultTruffleConfig();
  })

  afterEach(() => mock.clean());

  it('simple contract', async function(){
    verify.cleanInitialState();

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    verify.coverageGenerated(truffleConfig);

    const output = mock.getOutput(truffleConfig);
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
    verify.cleanInitialState();

    truffleConfig.compilers.solc.version = "0.4.24";

    mock.install('Oraclize', 'oraclize.js', solcoverConfig, truffleConfig, true);
    await plugin(truffleConfig);
  });

  // This project has three contract suites and uses .deployed() instances which
  // depend on truffle's migratons and the inter-test evm_revert / evm_snapshot mechanism.
  it('project evm_reverts repeatedly', async function() {
    verify.cleanInitialState();
    mock.installFullProject('multiple-migrations');
    await plugin(truffleConfig);

    const expected = [
      {
        file: mock.pathToContract(truffleConfig, 'ContractA.sol'),
        pct: 100
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractB.sol'),
        pct: 100,
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractC.sol'),
        pct: 100,
      },
    ];

    verify.lineCoverage(expected);
  });

  // This project has [ @skipForCoverage ] tags in the test descriptions
  // at selected 'contract' and 'it' blocks.
  it('uses solcoverjs mocha options', async function() {
    verify.cleanInitialState();

    solcoverConfig.mocha = {
      grep: '@skipForCoverage',
      invert: true,
    };

    solcoverConfig.silent = process.env.SILENT ? true : false,
    solcoverConfig.istanbulReporter = ['json-summary', 'text']

    mock.installFullProject('multiple-migrations', solcoverConfig);
    await plugin(truffleConfig);

    const expected = [
      {
        file: mock.pathToContract(truffleConfig, 'ContractA.sol'),
        pct: 0
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractB.sol'),
        pct: 0,
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractC.sol'),
        pct: 100,
      },
    ];

    verify.lineCoverage(expected);
  });

  it('skips a folder', async function() {
    verify.cleanInitialState();
    mock.installFullProject('skipping');
    await plugin(truffleConfig);

    const expected = [{
     file: mock.pathToContract(truffleConfig, 'ContractA.sol'),
     pct: 100
    }];

    const missing = [{
     file: mock.pathToContract(truffleConfig, 'skipped-folder/ContractB.sol'),
    }];

    verify.lineCoverage(expected);
    verify.coverageMissing(missing);
  });

  it('project with relative path solidity imports', async function() {
    verify.cleanInitialState();
    mock.installFullProject('import-paths');
    await plugin(truffleConfig);
  });

  it('project contains native solidity tests', async function(){
    verify.cleanInitialState();

    mock.install('Simple', 'TestSimple.sol', solcoverConfig);

    truffleConfig.logger = mock.testLogger;
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('native solidity tests'),
      `Should warn it is skipping native solidity tests: ${mock.loggerOutput.val}`
    );
  });

  it('contract only uses ".call"', async function(){
    verify.cleanInitialState();

    mock.install('OnlyCall', 'only-call.js', solcoverConfig);
    await plugin(truffleConfig);

    verify.coverageGenerated(truffleConfig);

    const output = mock.getOutput(truffleConfig);
    const path = Object.keys(output)[0];
    assert(output[path].fnMap['1'].name === 'addTwo', 'cov should map "addTwo"');
  });

  it('contract sends / transfers to instrumented fallback', async function(){
    verify.cleanInitialState();

    mock.install('Wallet', 'wallet.js', solcoverConfig);
    await plugin(truffleConfig);

    verify.coverageGenerated(truffleConfig);

    const output = mock.getOutput(truffleConfig);
    const path = Object.keys(output)[0];
    assert(output[path].fnMap['1'].name === 'transferPayment', 'cov should map "transferPayment"');
  });

  it('contracts are skipped', async function() {
    verify.cleanInitialState();

    solcoverConfig.skipFiles = ['Owned.sol'];

    mock.installDouble(['Proxy', 'Owned'], 'inheritance.js', solcoverConfig);
    await plugin(truffleConfig);

    verify.coverageGenerated(truffleConfig);

    const output = mock.getOutput(truffleConfig);
    const firstKey = Object.keys(output)[0];

    assert(Object.keys(output).length === 1, 'Wrong # of contracts covered');
    assert(firstKey.substr(firstKey.length - 9) === 'Proxy.sol', 'Wrong contract covered');
  });

  it('contract uses inheritance', async function() {
    verify.cleanInitialState();

    mock.installDouble(['Proxy', 'Owned'], 'inheritance.js', solcoverConfig);
    await plugin(truffleConfig);

    verify.coverageGenerated(truffleConfig);

    const output = mock.getOutput(truffleConfig);
    const ownedPath = Object.keys(output)[0];
    const proxyPath = Object.keys(output)[1];

    assert(output[ownedPath].fnMap['1'].name === 'constructor', '"constructor" not covered');
    assert(output[proxyPath].fnMap['1'].name === 'isOwner', '"isOwner" not covered');
  });

  // Truffle test asserts deployment cost is greater than 20,000,000 gas
  it('deployment cost > block gasLimit', async function() {
    mock.install('Expensive', 'block-gas-limit.js', solcoverConfig);
    await plugin(truffleConfig);
  });

  // Simple.sol with a failing assertion in a truffle test
  it('truffle tests failing', async function() {
    verify.cleanInitialState();

    mock.install('Simple', 'truffle-test-fail.js', solcoverConfig);

    try {
      await plugin(truffleConfig);
      assert.fail()
    } catch(err){
      assert(err.message.includes('failed under coverage'));
    }

    verify.coverageGenerated(truffleConfig);

    const output = mock.getOutput(truffleConfig);
    const path = Object.keys(output)[0];

    assert(output[path].fnMap['1'].name === 'test', 'cov missing "test"');
    assert(output[path].fnMap['2'].name === 'getX', 'cov missing "getX"');
  });

  it('uses the fallback server', async function(){
    verify.cleanInitialState();

    truffleConfig.logger = mock.testLogger;

    solcoverConfig = { forceBackupServer: true }

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes("Using ganache-core-sc"),
      `Should notify about backup server module: ${mock.loggerOutput.val}`
    );

  });
})
