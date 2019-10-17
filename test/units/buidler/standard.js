const assert = require('assert');
const fs = require('fs');
const path = require('path')
const shell = require('shelljs');

const verify = require('../../util/verifiers')
const mock = require('../../util/integration');
const plugin = require('../../../dist/buidler.plugin');

const {
  TASK_TEST
} = require("@nomiclabs/buidler/builtin-tasks/task-names");

// =======================
// Standard Use-case Tests
// =======================

describe.only('Buidler Plugin: standard use cases', function() {
  let buidlerConfig;
  let solcoverConfig;

  beforeEach(() => {
    mock.clean();

    mock.loggerOutput.val = '';
    solcoverConfig = {};
    buidlerConfig = mock.getDefaultBuidlerConfig();
    verify.cleanInitialState();
  })

  afterEach(() => {
    mock.buidlerTearDownEnv();
    mock.clean();
  });

  /*it.only('timeout', async function(){
    mock.buidlerSetupEnv(this);
    this.env.run('timeout')
  });*/

  it('simple contract', async function(){
    mock.install('Simple', 'simple.js', solcoverConfig);
    mock.buidlerSetupEnv(this);

    await this.env.run("coverage");

    /*verify.coverageGenerated(buidlerConfig);

    const output = mock.getOutput(buidlerConfig);
    const path = Object.keys(output)[0];

    assert(
      output[path].fnMap['1'].name === 'test',
      'coverage.json missing "test"'
    );

    assert(
      output[path].fnMap['2'].name === 'getX',
      'coverage.json missing "getX"'
    );*/
  });
})