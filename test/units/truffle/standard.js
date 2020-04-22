const assert = require('assert');
const fs = require('fs');
const path = require('path')
const shell = require('shelljs');

const verify = require('../../util/verifiers')
const mock = require('../../util/integration');
const plugin = require('../../../plugins/truffle.plugin');

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
    verify.cleanInitialState();
  })

  afterEach(() => mock.clean());

  it('simple contract', async function(){
    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    verify.coverageGenerated(truffleConfig);

    const output = mock.getOutput(truffleConfig);
    const path = Object.keys(output)[0];

    assert(
      output[path].fnMap['1'].name === 'test',
      'coverage.json missing "test"'
    );

    assert(
      output[path].fnMap['2'].name === 'getX',
      'coverage.json missing "getX"'
    );
  });

  // Instrumentation speed is fine - but this takes solc almost a minute to compile
  // Unskip whenever modifying the instrumentation files though.....
  it.skip('with many unbracketed statements (time check)', async function() {
    truffleConfig.compilers.solc.version = "0.4.24";

    mock.install('Oraclize', 'oraclize.js', solcoverConfig, truffleConfig, true);
    await plugin(truffleConfig);
  });

  // This project has three contract suites and uses .deployed() instances which
  // depend on truffle's migratons and the inter-test evm_revert / evm_snapshot mechanism.
  it('with multiple migrations (evm_reverts repeatedly)', async function() {
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


  it('tests in first layer and in a sub-folder', async function() {
    mock.installFullProject('tests-folder');
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

  it('imports: relative path imports & file w/ only-import statements', async function() {
    // Earlier versions of truffle crash on this case (5.0.31)
    // Later versions of truffle OOM (5.1.2)
    truffleConfig.useGlobalTruffle = true;

    mock.installFullProject('import-paths');
    await plugin(truffleConfig);

    const expected = [
      {
        file: mock.pathToContract(truffleConfig, 'OnlyUsesImports.sol'),
        pct: 100
      },
      {
        file: mock.pathToContract(truffleConfig, 'UsesImports.sol'),
        pct: 100,
      },
    ];

    verify.lineCoverage(expected);
  });

  it('uses libraries', async function() {
    mock.installFullProject('libraries');
    await plugin(truffleConfig);
  });

  it('uses native solidity tests', async function(){
    mock.install('Simple', 'TestSimple.sol', solcoverConfig);

    truffleConfig.logger = mock.testLogger;
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('native solidity tests'),
      `Should warn it is skipping native solidity tests: ${mock.loggerOutput.val}`
    );
  });

  it('uses inheritance', async function() {
    mock.installDouble(
      ['Proxy', 'Owned'],
      'inheritance.js',
      solcoverConfig
    );

    await plugin(truffleConfig);

    verify.coverageGenerated(truffleConfig);

    const output = mock.getOutput(truffleConfig);
    const ownedPath = Object.keys(output)[0];
    const proxyPath = Object.keys(output)[1];

    assert(
      output[ownedPath].fnMap['1'].name === 'constructor',
      '"constructor" not covered'
    );

    assert(
      output[proxyPath].fnMap['1'].name === 'isOwner',
      '"isOwner" not covered'
    );
  });

  it('only uses ".call"', async function(){
    mock.install('OnlyCall', 'only-call.js', solcoverConfig);
    await plugin(truffleConfig);

    verify.coverageGenerated(truffleConfig);

    const output = mock.getOutput(truffleConfig);
    const path = Object.keys(output)[0];
    assert(
      output[path].fnMap['1'].name === 'addTwo',
      'cov should map "addTwo"'
    );
  });

  it('sends / transfers to instrumented fallback', async function(){
    mock.install('Wallet', 'wallet.js', solcoverConfig);
    await plugin(truffleConfig);

    verify.coverageGenerated(truffleConfig);

    const output = mock.getOutput(truffleConfig);
    const path = Object.keys(output)[0];
    assert(
      output[path].fnMap['1'].name === 'transferPayment',
      'cov should map "transferPayment"'
    );
  });

  // Truffle test asserts deployment cost is greater than 20,000,000 gas
  // Test times out on CircleCI @ 100000 ms. Fine locally though.
  it('deployment cost > block gasLimit', async function() {
    if (process.env.CI) return;

    mock.install('Expensive', 'block-gas-limit.js', solcoverConfig);
    await plugin(truffleConfig);
  });

  // Simple.sol with a failing assertion in a truffle test
  it('unit tests failing', async function() {
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

  // This test tightly coupled to the ganache version in truffle dev dep
  it('uses the server from truffle by default', async function(){
    truffleConfig.logger = mock.testLogger;
    truffleConfig.version = true;

    // Baseline inequality check
    const truffleClientVersion = "v2.5.7";

    // Truffle client
    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes(truffleClientVersion),
      `Should use truffles ganache: ${mock.loggerOutput.val}`
    );
  });

  it('uses the fallback server', async function(){
    truffleConfig.logger = mock.testLogger;
    solcoverConfig.forceBackupServer = true;

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes("Using ganache-cli"),
      `Should notify about backup server module: ${mock.loggerOutput.val}`
    );
  });

  // This test errors if the reporter is not re-designated as 'spec' correctly
  it('disables eth-gas-reporter', async function(){
    truffleConfig.mocha = { reporter: 'eth-gas-reporter' };

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);
  });

  it('disables optimization when truffle-config uses V4 format', async function(){
    solcoverConfig = {
      silent: process.env.SILENT ? true : false,
      istanbulReporter: ['json-summary', 'text']
    };

    truffleConfig.solc = {
      optimizer: { enabled: true, runs: 200 }
    };

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    const expected = [
      {
        file: mock.pathToContract(truffleConfig, 'Simple.sol'),
        pct: 100
      }
    ];

    verify.lineCoverage(expected);
  });

  it('locates .coverage_contracts correctly when dir is subfolder', async function(){
    solcoverConfig = {
      silent: process.env.SILENT ? true : false,
      istanbulReporter: ['json-summary', 'text']
    };

    truffleConfig.contracts_directory = path.join(
      process.cwd(),
      mock.pathToTemp("contracts/A")
    );

    mock.installFullProject('contract-subfolders');
    await plugin(truffleConfig);
  })

  // This test tightly coupled to the ganache version in production deps
  // "test-files" project solcoverjs includes `client: require('ganache-cli')`
  it('config: client', async function(){
    truffleConfig.logger = mock.testLogger;
    truffleConfig.version = true;

    const configClientVersion = "v2.13.2";

    // Config client
    mock.installFullProject('ganache-solcoverjs');
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes(configClientVersion),
      `Should use solcover provided ganache: ${mock.loggerOutput.val}`
    );
  });

  it('config: istanbulFolder', async function(){
    solcoverConfig.istanbulFolder = mock.pathToTemp('specialFolder');

    // Truffle client
    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(verify.pathExists(solcoverConfig.istanbulFolder));
  });

  // This project has [ @skipForCoverage ] tags in the test descriptions
  // at selected 'contract' and 'it' blocks.
  it('config: mocha options', async function() {
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

  // Truffle test asserts balance is 777 ether
  it('config: providerOptions', async function() {
    solcoverConfig.providerOptions = { default_balance_ether: 777 }

    mock.install('Simple', 'testrpc-options.js', solcoverConfig);
    await plugin(truffleConfig);
  });

  it('config: skipped file', async function() {
    solcoverConfig.skipFiles = ['Owned.sol'];

    mock.installDouble(
      ['Proxy', 'Owned'],
      'inheritance.js',
      solcoverConfig
    );

    await plugin(truffleConfig);

    verify.coverageGenerated(truffleConfig);

    const output = mock.getOutput(truffleConfig);
    const firstKey = Object.keys(output)[0];

    assert(
      Object.keys(output).length === 1,
      'Wrong # of contracts covered'
    );

    assert(
      firstKey.substr(firstKey.length - 9) === 'Proxy.sol',
      'Wrong contract covered'
    );
  });

  it('config: skipped folder', async function() {
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

  it('config: "onServerReady", "onTestsComplete", ...', async function() {
    truffleConfig.logger = mock.testLogger;
    mock.installFullProject('test-files');

    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('running onPreCompile')     &&
      mock.loggerOutput.val.includes('running onServerReady')     &&
      mock.loggerOutput.val.includes('running onTestsComplete')   &&
      mock.loggerOutput.val.includes('running onCompileComplete') &&
      mock.loggerOutput.val.includes('running onIstanbulComplete'),

      `Should run "on" hooks : ${mock.loggerOutput.val}`
    );
  });

  it('config: includeStatementCoverage, includeFunctionCoverage', async function(){
    solcoverConfig.istanbulReporter = ['json-summary', 'text']
    solcoverConfig.measureStatementCoverage = false;
    solcoverConfig.measureFunctionCoverage = false;

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    const expected = [
      {
        file: mock.pathToContract(truffleConfig, 'Simple.sol'),
        total: 0
      }
    ];

    verify.statementCoverage(expected, 'total');
    verify.functionCoverage(expected, 'total');
  });

  // Fails with Truffle 5.0.31, but newer Truffle causes OOM when running whole suite.
  // Running the same test with Buidler though...
  it.skip('solc 0.6.x', async function(){
    mock.installFullProject('solc-6');
    await plugin(truffleConfig);

    const expected = [
      {
        file: mock.pathToContract(truffleConfig, 'ContractA.sol'),
        pct: 100
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractB.sol'),
        pct: 0,
      }
    ];

    verify.lineCoverage(expected);
  })

  it('compiles when a project includes vyper contracts', async function() {
    const skipMigration = true;

    truffleConfig.logger = mock.testLogger;
    solcoverConfig.istanbulReporter = ['json-summary', 'text']

    mock.installDouble(
      ['Simple', 'auction.vy'],
      'simple.js',
      solcoverConfig,
      skipMigration
    );


    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('Compiling ./.coverage_contracts/auction.vy')
    );

    const expected = [
      {
        file: mock.pathToContract(truffleConfig, 'Simple.sol'),
        pct: 100
      }
    ];

    verify.lineCoverage(expected);
  });

  it('logicalOR', async function(){
    mock.installFullProject('logical-or');
    await plugin(truffleConfig);

    const expected = [
      {
        file: mock.pathToContract(truffleConfig, 'ContractA.sol'),
        pct: 59.09
      }
    ];

    verify.branchCoverage(expected);
  })
})
