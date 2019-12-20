const assert = require('assert');
const fs = require('fs');
const path = require('path')
const pify = require('pify')
const shell = require('shelljs');
const ganache = require('ganache-cli')

const verify = require('../../util/verifiers')
const mock = require('../../util/integration');
const plugin = require('../../../plugins/buidler.plugin');

// =======
// Errors
// =======

describe('Buidler Plugin: error cases', function() {
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

  it('project contains no contract sources folder', async function() {
    mock.installFullProject('no-sources');
    mock.buidlerSetupEnv(this);

    try {
      await this.env.run("coverage");
      assert.fail()
    } catch(err){
      assert(
        err.message.includes('Cannot locate expected contract sources folder'),
        `Should error when contract sources cannot be found:: ${err.message}`
      );

      assert(
        err.message.includes('sc_temp/contracts'),
        `Error message should contain path:: ${err.message}`
      );
    }

    verify.coverageNotGenerated(buidlerConfig);
  });

  it('.solcover.js has syntax error', async function(){
    mock.installFullProject('bad-solcoverjs');
    mock.buidlerSetupEnv(this);

    try {
      await this.env.run("coverage");
      assert.fail()
    } catch(err){
      assert(
        err.message.includes('Could not load .solcover.js config file.'),
        `Should notify when solcoverjs has syntax error:: ${err.message}`
      );
    }

    verify.coverageNotGenerated(buidlerConfig);
  })

  it('.solcover.js has incorrectly formatted option', async function(){
    solcoverConfig.port = "Antwerpen";

    mock.install('Simple', 'simple.js', solcoverConfig);
    mock.buidlerSetupEnv(this);

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

  it('tries to launch with a port already in use', async function(){
    const server = ganache.server();

    mock.install('Simple', 'simple.js', solcoverConfig);
    mock.buidlerSetupEnv(this);

    await pify(server.listen)(8555);

    try {
      await this.env.run("coverage");
      assert.fail();
    } catch(err){
      assert(
        err.message.includes('is already in use') &&
        err.message.includes('lsof'),
        `Should error on port-in-use with advice: ${err.message}`
      )
    }

    await pify(server.close)();
  });

  it('uses an invalid istanbul reporter', async function() {
    solcoverConfig = {
      silent: process.env.SILENT ? true : false,
      istanbulReporter: ['does-not-exist']
    };

    mock.install('Simple', 'simple.js', solcoverConfig);
    mock.buidlerSetupEnv(this);

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

  // Truffle test contains syntax error
  it('truffle crashes', async function() {
    mock.install('Simple', 'truffle-crash.js', solcoverConfig);
    mock.buidlerSetupEnv(this);

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
    mock.buidlerSetupEnv(this);

    try {
      await this.env.run("coverage");
      assert.fail()
    } catch(err){
      assert(err.message.includes('Compilation failed'));
    }

    verify.coverageNotGenerated(buidlerConfig);
  });

  it('instrumentation failure', async function(){
    mock.install('Unparseable', 'simple.js', solcoverConfig);
    mock.buidlerSetupEnv(this);

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

    verify.coverageNotGenerated(buidlerConfig);
  });
})
