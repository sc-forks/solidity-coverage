const assert = require('assert');
const fs = require('fs');
const path = require('path')
const shell = require('shelljs');

const verify = require('../../util/verifiers')
const mock = require('../../util/integration');

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

  // Simple.sol with a failing assertion in a buidler-truffle5 test
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
  });
})
