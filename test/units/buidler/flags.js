const assert = require('assert');
const fs = require('fs');
const path = require('path')
const shell = require('shelljs');

const verify = require('../../util/verifiers')
const mock = require('../../util/integration');
const plugin = require('../../../dist/buidler.plugin');

// =======================
// CLI Options / Flags
// =======================
async function delay(){
  return new Promise(res  => setTimeout(() => res(), 1000))
}

describe('Buidler Plugin: command line options', function() {
  let buidlerConfig;
  let solcoverConfig;

  beforeEach(function(){
    mock.clean();

    mock.loggerOutput.val = '';
    solcoverConfig = {
      skipFiles: ['Migrations.sol'],
      silent: process.env.SILENT ? true : false,
      istanbulReporter: ['json-summary', 'text']
    };
    buidlerConfig = mock.getDefaultBuidlerConfig();
    verify.cleanInitialState();
  })

  afterEach(async function (){
    mock.buidlerTearDownEnv();
    mock.clean();
  });


  it('--temp', async function(){
    const taskArgs = {
      temp: 'special_folder'
    }

    mock.install('Simple', 'simple.js', solcoverConfig);
    mock.buidlerSetupEnv(this);

    await this.env.run("coverage", taskArgs);

    const expected = [{
      file: mock.pathToContract(buidlerConfig, 'Simple.sol'),
      pct: 100
    }];

    verify.lineCoverage(expected);
  });

  it('--network (declared port mismatches)', async function(){
    const taskArgs = {
      network: 'development' // 8545
    }

    solcoverConfig.port = 8222;

    mock.install('Simple', 'simple.js', solcoverConfig);
    mock.buidlerSetupEnv(this);

    await this.env.run("coverage", taskArgs);

    assert(
      mock.loggerOutput.val.includes("The 'port' values"),
      `Should notify about mismatched port values: ${mock.loggerOutput.val}`
    );

    assert(
      mock.loggerOutput.val.includes("8545"),
      `Should have used default coverage port 8545: ${mock.loggerOutput.val}`
    );

    const expected = [{
      file: mock.pathToContract(buidlerConfig, 'Simple.sol'),
      pct: 100
    }];

    verify.lineCoverage(expected);
  });

  it('--testFiles test/<fileName>', async function() {
    const taskArgs = {
      testFiles: path.join(
        buidlerConfig.paths.root,
        'test/specific_a.js'
      )
    };

    mock.installFullProject('test-files');
    mock.buidlerSetupEnv(this);

    await this.env.run("coverage", taskArgs);

    const expected = [
      {
        file: mock.pathToContract(buidlerConfig, 'ContractA.sol'),
        pct: 100
      },
      {
        file: mock.pathToContract(buidlerConfig, 'ContractB.sol'),
        pct: 0,
      },
      {
        file: mock.pathToContract(buidlerConfig, 'ContractC.sol'),
        pct: 0,
      },
    ];

    verify.lineCoverage(expected);
  });

  it('--config ../.solcover.js', async function() {
    // Write solcoverjs to parent dir of sc_temp (where the test project is installed)
    fs.writeFileSync(
      '.solcover.js',
      `module.exports=${JSON.stringify(solcoverConfig)}`
    );

    // This relative path has to be ./ prefixed (it's path.joined to buidler's paths.root)
    const taskArgs = {
      solcoverjs: './../.solcover.js'
    };

    mock.install('Simple', 'simple.js');
    mock.buidlerSetupEnv(this);

    await this.env.run("coverage", taskArgs);

    // The relative solcoverjs uses the json-summary reporter
    const expected = [{
      file: mock.pathToContract(buidlerConfig, 'Simple.sol'),
      pct: 100
    }];

    verify.lineCoverage(expected);
    shell.rm('.solcover.js');
  });
});

