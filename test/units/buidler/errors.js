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
})
