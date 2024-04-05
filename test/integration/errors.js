const assert = require('assert');
const fs = require('fs');
const path = require('path')
const pify = require('pify')
const shell = require('shelljs');

const verify = require('./../util/verifiers')
const mock = require('./../util/integration');

// =======
// Errors
// =======

describe('Hardhat Plugin: error cases', function() {
  let hardhatConfig;
  let solcoverConfig;

  beforeEach(() => {
    mock.clean();

    mock.loggerOutput.val = '';
    solcoverConfig = {};
    hardhatConfig = mock.getDefaultHardhatConfig();
    verify.cleanInitialState();
  })

  afterEach(() => {
    mock.hardhatTearDownEnv();
    mock.clean();
  });

  it('.solcover.js has syntax error', async function(){
    mock.installFullProject('bad-solcoverjs');
    mock.hardhatSetupEnv(this);

    try {
      await this.env.run("coverage");
      assert.fail()
    } catch(err){
      assert(
        err.message.includes('Could not load .solcover.js config file.'),
        `Should notify when solcoverjs has syntax error:: ${err.message}`
      );
    }

    verify.coverageNotGenerated(hardhatConfig);
  })

  it('.solcover.js has incorrectly formatted option', async function(){
    solcoverConfig.port = "Antwerpen";

    mock.install('Simple', 'simple.js', solcoverConfig);
    mock.hardhatSetupEnv(this);

    try {
      await this.env.run("coverage");
      assert.fail()
    } catch (err) {
      assert(
        err.message.includes('config option'),
        `Should error on incorrect config options: ${err.message}`
      );
    }
  });

  it('tries to launch with the network flag', async function(){
    const taskArgs = {
      network: "development"
    }

    mock.install('Simple', 'simple.js', solcoverConfig);
    mock.hardhatSetupEnv(this);

    try {
      await this.env.run("coverage", taskArgs);
      assert.fail();
    } catch(err){
      assert(
        err.message.includes('--network cli flag is not supported') &&
        `Should error network flag disallowed: ${err.message}`
      )
    }
  });

  it('uses an invalid istanbul reporter', async function() {
    solcoverConfig = {
      silent: process.env.SILENT ? true : false,
      istanbulReporter: ['does-not-exist']
    };

    mock.install('Simple', 'simple.js', solcoverConfig);
    mock.hardhatSetupEnv(this);

    try {
      await this.env.run("coverage");
      assert.fail();
    } catch(err){
      assert(
        err.message.includes('does-not-exist') &&
        err.message.includes('coverage reports could not be generated'),
        `Should error on invalid reporter: ${err.message}`
      )
    }

  });

  // Hardhat test contains syntax error
  it('hardhat crashes', async function() {
    mock.install('Simple', 'truffle-crash.js', solcoverConfig);
    mock.hardhatSetupEnv(this);

    try {
      await this.env.run("coverage");
      assert.fail()
    } catch(err){
      assert(err.toString().includes('SyntaxError'));
    }
  });

  // Solidity syntax errors
  it('compilation failure', async function(){
    mock.install('SimpleError', 'simple.js', solcoverConfig);
    mock.hardhatSetupEnv(this);

    try {
      await this.env.run("coverage");
      assert.fail()
    } catch(err){
      assert(err.message.includes('Compilation failed'));
    }

    verify.coverageNotGenerated(hardhatConfig);
  });

  it('instrumentation failure', async function(){
    mock.install('Unparseable', 'simple.js', solcoverConfig);
    mock.hardhatSetupEnv(this);

    try {
      await this.env.run("coverage");
      assert.fail()
    } catch(err){
      assert(
        err.message.includes('Unparseable.sol.'),
        `Should throw instrumentation errors with file name: ${err.toString()}`
      );

      assert(err.stack !== undefined, 'Should have error trace')
    }

    verify.coverageNotGenerated(hardhatConfig);
  });

  it('mocha parallel option is true', async function(){
    mock.installFullProject('parallel');
    mock.hardhatSetupEnv(this);

    try {
      await this.env.run("coverage");
      assert.fail()
    } catch(err){
      assert(
        err.message.includes('Coverage cannot be run in mocha parallel mode'),
        `Should notify when mocha parallel flag is set:: ${err.message}`
      );
    }

    verify.coverageNotGenerated(hardhatConfig);
  })

  it('viem plugin (when SOLIDITY_COVERAGE is undefined)', async function(){
    mock.installFullProject('viem');
    mock.hardhatSetupEnv(this);

    try {
      await this.env.run("coverage");
      assert.fail()
    } catch(err){
      assert(
        err.message.includes('requires an environment variable'),
        `Should error when viem plugin is used without env variable:: ${err.message}`
      );
    }

    verify.coverageNotGenerated(hardhatConfig);
  });
})
