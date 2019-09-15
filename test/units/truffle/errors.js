const assert = require('assert');
const fs = require('fs');
const path = require('path')
const shell = require('shelljs');

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

  it('project .solcover.js has syntax error', async function(){
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
      assert(err.toString().includes('Compilation failed'));
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
        err.toString().includes('/Unparseable.sol.'),
        `Should throw instrumentation errors with file name: ${err.toString()}`
      );

      assert(err.stack !== undefined, 'Should have error trace')
    }

    verify.coverageNotGenerated(truffleConfig);
  })
})
