const assert = require('assert');
const fs = require('fs');
const path = require('path')
const pify = require('pify')
const shell = require('shelljs');
const ganache = require('ganache-core-sc');

const verify = require('../../util/verifiers')
const mock = require('../../util/integration.truffle');
const plugin = require('../../../dist/truffle.plugin');

// =======
// Errors
// =======

describe('Truffle Plugin: error cases', function() {
  let truffleConfig;
  let solcoverConfig;

  beforeEach(() => {
    mock.clean();

    mock.loggerOutput.val = '';
    solcoverConfig = {};
    truffleConfig = mock.getDefaultTruffleConfig();
  })

  afterEach(() => mock.clean());

  it('project contains no contract sources folder', async function() {
    verify.cleanInitialState();
    mock.installFullProject('no-sources');

    try {
      await plugin(truffleConfig);
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

    verify.coverageNotGenerated(truffleConfig);
  });

  it('.solcover.js has syntax error', async function(){
    verify.cleanInitialState();

    mock.installFullProject('bad-solcoverjs');
    try {
      await plugin(truffleConfig);
      assert.fail()
    } catch(err){
      assert(
        err.message.includes('Could not load .solcover.js config file.'),
        `Should notify when solcoverjs has syntax error:: ${err.message}`
      );
    }

    verify.coverageNotGenerated(truffleConfig);
  })

  it('.solcover.js has incorrectly formatted option', async function(){
    verify.cleanInitialState();
    solcoverConfig.port = "Antwerpen";

    mock.install('Simple', 'simple.js', solcoverConfig);

    try {
      await plugin(truffleConfig);
      assert.fail()
    } catch (err) {
      assert(
        err.message.includes('config option'),
        `Should error on incorrect config options: ${err.message}`
      );
    }
  });

  it('lib module load failure', async function(){
    verify.cleanInitialState();
    truffleConfig.usePluginTruffle = true;
    truffleConfig.forceLibFailure = true;

    mock.install('Simple', 'simple.js', solcoverConfig);

    try {
      await plugin(truffleConfig);
      assert.fail()
    } catch (err) {
      assert(
        err.message.includes('Unable to load plugin copy'),
        `Should error on failed lib module load: ${err.message}`
      );
    }
  });

  it('--network <target> is not declared in truffle-config.js', async function(){
    verify.cleanInitialState();

    truffleConfig.network = 'does-not-exist';

    mock.install('Simple', 'simple.js', solcoverConfig);

    try {
      await plugin(truffleConfig);
      assert.fail()
    } catch (err) {

      assert(
        err.message.includes('is not defined'),
        `Should notify network 'is not defined': ${err.message}`
      );

      assert(
        err.message.includes('does-not-exist'),
        `Should name missing network: 'does-not-exist': ${err.message}`
      );
    }
  });

  // This case *does* throw an error, but it's uncatch-able;
  it('tries to launch with a port already in use', async function(){
    verify.cleanInitialState();
    const server = ganache.server();

    truffleConfig.network = 'development';
    mock.install('Simple', 'simple.js', solcoverConfig);

    await pify(server.listen)(8545);

    await plugin(truffleConfig);
    try {
      await plugin(truffleConfig);
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

  // Truffle test contains syntax error
  it('truffle crashes', async function() {
    verify.cleanInitialState();

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
    verify.cleanInitialState();

    mock.install('SimpleError', 'simple.js', solcoverConfig);

    try {
      await plugin(truffleConfig);
      assert.fail()
    } catch(err){
      assert(err.message.includes('Compilation failed'));
    }

    verify.coverageNotGenerated(truffleConfig);
  });

  it('instrumentation failure', async function(){
    verify.cleanInitialState();

    mock.install('Unparseable', 'simple.js', solcoverConfig);

    try {
      await plugin(truffleConfig);
      assert.fail()
    } catch(err){
      assert(
        err.message.includes('Unparseable.sol.'),
        `Should throw instrumentation errors with file name: ${err.toString()}`
      );

      assert(err.stack !== undefined, 'Should have error trace')
    }

    verify.coverageNotGenerated(truffleConfig);
  })

  it('user runs "solidity-coverage" as shell command', function(){
    const pathToCommand = './dist/bin.js';
    const pkg = require('../../../package.json');

    assert(
      pkg.bin['solidity-coverage'] === pathToCommand,
      'bin.js should be pkg.bin'
    );

    const output = shell.exec(`node ${pathToCommand}`, {silent:true}).stdout;

    assert(
      output.includes('no longer a shell command'),
      `should have right info: ${output}`
    );
  });

  it('user runs "testrpc-sc" as shell command', function(){
    const output = shell.exec(`testrpc-sc`, {silent:true}).stdout;

    assert(
      output.includes('does not use "testrpc-sc"'),
      `should have right info: ${output}`
    );
  });
})
