const assert = require('assert');
const fs = require('fs');
const path = require('path')
const shell = require('shelljs');

const verify = require('../../util/verifiers')
const mock = require('../../util/integration');

// =======================
// CLI Options / Flags
// =======================

describe('Hardhat Plugin: command line options', function() {
  let hardhatConfig;
  let solcoverConfig;

  beforeEach(function(){
    mock.clean();

    mock.loggerOutput.val = '';
    solcoverConfig = {
      skipFiles: ['Migrations.sol'],
      silent: process.env.SILENT ? true : false,
      istanbulReporter: ['json-summary', 'text']
    };
    hardhatConfig = mock.getDefaultHardhatConfig();
    verify.cleanInitialState();
  })

  afterEach(async function (){
    mock.hardhatTearDownEnv();
    mock.clean();
  });


  it('--temp', async function(){
    const taskArgs = {
      temp: 'special_folder'
    }

    mock.install('Simple', 'simple.js', solcoverConfig);
    mock.hardhatSetupEnv(this);

    await this.env.run("coverage", taskArgs);

    const expected = [{
      file: mock.pathToContract(hardhatConfig, 'Simple.sol'),
      pct: 100
    }];

    verify.lineCoverage(expected);
  });

  it('--network (declared port mismatches)', async function(){
    solcoverConfig.port = 8222;

    mock.install('Simple', 'simple.js', solcoverConfig);
    mock.hardhatSetupEnv(this);

    this.env.hardhatArguments.network = "development";

    await this.env.run("coverage");

    assert(
      mock.loggerOutput.val.includes("The 'port' values"),
      `Should notify about mismatched port values: ${mock.loggerOutput.val}`
    );

    assert(
      mock.loggerOutput.val.includes("8545"),
      `Should have used default coverage port 8545: ${mock.loggerOutput.val}`
    );

    assert(
      mock.loggerOutput.val.includes("development"),
      `Should have used specified network name: ${mock.loggerOutput.val}`
    );

    const expected = [{
      file: mock.pathToContract(hardhatConfig, 'Simple.sol'),
      pct: 100
    }];

    verify.lineCoverage(expected);
  });

  it('--testfiles test/<fileName>', async function() {
    const taskArgs = {
      testfiles: path.join(
        hardhatConfig.paths.root,
        'test/specific_a.js'
      )
    };

    mock.installFullProject('test-files');
    mock.hardhatSetupEnv(this);

    await this.env.run("coverage", taskArgs);

    const expected = [
      {
        file: mock.pathToContract(hardhatConfig, 'ContractA.sol'),
        pct: 100
      },
      {
        file: mock.pathToContract(hardhatConfig, 'ContractB.sol'),
        pct: 0,
      },
      {
        file: mock.pathToContract(hardhatConfig, 'ContractC.sol'),
        pct: 0,
      },
    ];

    verify.lineCoverage(expected);
  });

  it('--file test/<glob*>', async function() {
    const taskArgs = {
      testfiles: path.join(
        hardhatConfig.paths.root,
        'test/**/globby*'
      )
    };

    mock.installFullProject('test-files');
    mock.hardhatSetupEnv(this);

    await this.env.run("coverage", taskArgs);

    const expected = [
      {
        file: mock.pathToContract(hardhatConfig, 'ContractA.sol'),
        pct: 0,
      },
      {
        file: mock.pathToContract(hardhatConfig, 'ContractB.sol'),
        pct: 100,
      },
      {
        file: mock.pathToContract(hardhatConfig, 'ContractC.sol'),
        pct: 100,
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

    // This relative path has to be ./ prefixed (it's path.joined to hardhat's paths.root)
    const taskArgs = {
      solcoverjs: './../.solcover.js'
    };

    mock.install('Simple', 'simple.js');
    mock.hardhatSetupEnv(this);

    await this.env.run("coverage", taskArgs);

    // The relative solcoverjs uses the json-summary reporter
    const expected = [{
      file: mock.pathToContract(hardhatConfig, 'Simple.sol'),
      pct: 100
    }];

    verify.lineCoverage(expected);
    shell.rm('.solcover.js');
  });

  it('--matrix', async function(){
    const taskArgs = {
      matrix: true
    }

    mock.installFullProject('matrix');
    mock.hardhatSetupEnv(this);

    await this.env.run("coverage", taskArgs);

    // Integration test checks output path configurabililty
    const altPath = path.join(process.cwd(), './alternateTestMatrix.json');
    const expPath = path.join(process.cwd(), './expectedTestMatrixHardhat.json');
    const producedMatrix = require(altPath)
    const expectedMatrix = require(expPath);

    assert.deepEqual(producedMatrix, expectedMatrix);
  });
});

