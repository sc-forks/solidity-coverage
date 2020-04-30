const assert = require('assert');
const fs = require('fs');
const path = require('path')
const shell = require('shelljs');

const verify = require('../../util/verifiers')
const mock = require('../../util/integration');
const plugin = require('../../../plugins/buidler.plugin');

// =======================
// Standard Use-case Tests
// =======================

describe('Buidler Plugin: standard use cases', function() {
  let buidlerConfig;
  let solcoverConfig;

  beforeEach(() => {
    mock.clean();

    mock.loggerOutput.val = '';
    solcoverConfig = { skipFiles: ['Migrations.sol']};
    buidlerConfig = mock.getDefaultBuidlerConfig();
    verify.cleanInitialState();
  })

  afterEach(() => {
    mock.buidlerTearDownEnv();
    mock.clean();
  });

  it('simple contract', async function(){
    mock.install('Simple', 'simple.js', solcoverConfig);
    mock.buidlerSetupEnv(this);

    await this.env.run("coverage");

    verify.coverageGenerated(buidlerConfig);

    const output = mock.getOutput(buidlerConfig);
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

  it('default network ("buidlerevm")', async function(){
    mock.install('Simple', 'simple.js', solcoverConfig);
    mock.buidlerSetupEnv(this);

    this.env.buidlerArguments.network = "buidlerevm"

    await this.env.run("coverage");

    assert(
      mock.loggerOutput.val.includes("8555"),
      `Should have used default coverage port 8555: ${mock.loggerOutput.val}`
    );

    assert(
      mock.loggerOutput.val.includes("soliditycoverage"),
      `Should have used specified network name: ${mock.loggerOutput.val}`
    );
  });

  it('with relative path solidity imports', async function() {
    mock.installFullProject('import-paths');
    mock.buidlerSetupEnv(this);

    await this.env.run("coverage");
  });

  it('uses inheritance', async function() {
    mock.installDouble(
      ['Proxy', 'Owned'],
      'inheritance.js',
      solcoverConfig
    );

    mock.buidlerSetupEnv(this);

    await this.env.run("coverage");

    verify.coverageGenerated(buidlerConfig);

    const output = mock.getOutput(buidlerConfig);
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
    mock.buidlerSetupEnv(this);

    await this.env.run("coverage");

    verify.coverageGenerated(buidlerConfig);

    const output = mock.getOutput(buidlerConfig);
    const path = Object.keys(output)[0];
    assert(
      output[path].fnMap['1'].name === 'addTwo',
      'cov should map "addTwo"'
    );
  });

  it('sends / transfers to instrumented fallback', async function(){
    mock.install('Wallet', 'wallet.js', solcoverConfig);
    mock.buidlerSetupEnv(this);

    await this.env.run("coverage");

    verify.coverageGenerated(buidlerConfig);

    const output = mock.getOutput(buidlerConfig);
    const path = Object.keys(output)[0];
    assert(
      output[path].fnMap['1'].name === 'transferPayment',
      'cov should map "transferPayment"'
    );
  });

  // Truffle test asserts deployment cost is greater than 20,000,000 gas
  it('deployment cost > block gasLimit', async function() {
    mock.install('Expensive', 'block-gas-limit.js', solcoverConfig);
    mock.buidlerSetupEnv(this);

    await this.env.run("coverage");
  });

  // Simple.sol with a failing assertion in a truffle test
  it('unit tests failing', async function() {
    mock.install('Simple', 'truffle-test-fail.js', solcoverConfig);
    mock.buidlerSetupEnv(this);

    try {
      await this.env.run("coverage");
      assert.fail()
    } catch(err){
      assert(err.message.includes('failed under coverage'));
    }

    verify.coverageGenerated(buidlerConfig);

    const output = mock.getOutput(buidlerConfig);
    const path = Object.keys(output)[0];

    assert(output[path].fnMap['1'].name === 'test', 'cov missing "test"');
    assert(output[path].fnMap['2'].name === 'getX', 'cov missing "getX"');
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

    mock.installFullProject('multiple-suites', solcoverConfig);
    mock.buidlerSetupEnv(this);

    await this.env.run("coverage");

    const expected = [
      {
        file: mock.pathToContract(buidlerConfig, 'ContractA.sol'),
        pct: 0
      },
      {
        file: mock.pathToContract(buidlerConfig, 'ContractB.sol'),
        pct: 0,
      },
      {
        file: mock.pathToContract(buidlerConfig, 'ContractC.sol'),
        pct: 100,
      },
    ];

    verify.lineCoverage(expected);
  });

  // Truffle test asserts balance is 777 ether
  it('config: providerOptions', async function() {
    solcoverConfig.providerOptions = { default_balance_ether: 777 }

    mock.install('Simple', 'testrpc-options.js', solcoverConfig);
    mock.buidlerSetupEnv(this);

    await this.env.run("coverage");
  });

  it('config: skipped file', async function() {
    solcoverConfig.skipFiles = ['Migrations.sol', 'Owned.sol'];

    mock.installDouble(
      ['Proxy', 'Owned'],
      'inheritance.js',
      solcoverConfig
    );

    mock.buidlerSetupEnv(this);

    await this.env.run("coverage");

    verify.coverageGenerated(buidlerConfig);

    const output = mock.getOutput(buidlerConfig);
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
    mock.buidlerSetupEnv(this);

    await this.env.run("coverage");

    const expected = [{
     file: mock.pathToContract(buidlerConfig, 'ContractA.sol'),
     pct: 100
    }];

    const missing = [{
     file: mock.pathToContract(buidlerConfig, 'skipped-folder/ContractB.sol'),
    }];

    verify.lineCoverage(expected);
    verify.coverageMissing(missing);
  });

  it('config: "onServerReady", "onTestsComplete", ...', async function() {
    mock.installFullProject('test-files');

    mock.buidlerSetupEnv(this);

    await this.env.run("coverage");

    assert(
      mock.loggerOutput.val.includes('running onServerReady')     &&
      mock.loggerOutput.val.includes('running onTestsComplete')   &&
      mock.loggerOutput.val.includes('running onCompileComplete') &&
      mock.loggerOutput.val.includes('running onIstanbulComplete'),

      `Should run "on" hooks : ${mock.loggerOutput.val}`
    );
  });

  it('solc 0.6.x', async function(){
    mock.installFullProject('solc-6');
    mock.buidlerSetupEnv(this);

    await this.env.run("coverage");

    const expected = [
      {
        file: mock.pathToContract(buidlerConfig, 'ContractA.sol'),
        pct: 100
      },
      {
        file: mock.pathToContract(buidlerConfig, 'ContractB.sol'),
        pct: 0,
      }
    ];

    verify.lineCoverage(expected);
  })

  // This test freezes when gas-reporter is not disabled
  it('disables buidler-gas-reporter', async function() {
    mock.installFullProject('buidler-gas-reporter');
    mock.buidlerSetupEnv(this);

    await this.env.run("coverage");
  });
})
