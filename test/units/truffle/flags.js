const assert = require('assert');
const fs = require('fs');
const path = require('path')
const shell = require('shelljs');

const verify = require('../../util/verifiers')
const mock = require('../../util/integration');
const plugin = require('../../../plugins/truffle.plugin');

// =======================
// CLI Options / Flags
// =======================

describe('Truffle Plugin: command line options', function() {
  let truffleConfig;
  let solcoverConfig;

  beforeEach(() => {
    mock.clean();

    mock.loggerOutput.val = '';
    solcoverConfig = {};
    truffleConfig = mock.getDefaultTruffleConfig();
    verify.cleanInitialState();

  })

  afterEach(() => mock.clean());

  // Running out of memory...
  it.skip('--usePluginTruffle', async function(){
    truffleConfig.usePluginTruffle = true;
    truffleConfig.logger = mock.testLogger;

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('fallback Truffle library module'),
      `Should notify it's using plugin truffle lib copy: ${mock.loggerOutput.val}`
    );
  });

  it('--file test/<fileName>', async function() {
    truffleConfig.file = path.join(
      truffleConfig.working_directory,
      'test/specific_a.js'
    );

    mock.installFullProject('test-files');
    await plugin(truffleConfig);

    const expected = [
      {
        file: mock.pathToContract(truffleConfig, 'ContractA.sol'),
        pct: 100
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractB.sol'),
        pct: 0,
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractC.sol'),
        pct: 0,
      },
    ];

    verify.lineCoverage(expected);
  });

  it('--file test/<glob*>', async function() {
    truffleConfig.file = path.join(
      truffleConfig.working_directory,
      'test/globby*'
    );

    mock.installFullProject('test-files');
    await plugin(truffleConfig);

    const expected = [
      {
        file: mock.pathToContract(truffleConfig, 'ContractA.sol'),
        pct: 0,
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractB.sol'),
        pct: 100,
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractC.sol'),
        pct: 100,
      },
    ];

    verify.lineCoverage(expected);
  });

  it('--file test/gl{o,b}*.js', async function() {
    truffleConfig.file = path.join(
      truffleConfig.working_directory,
      'test/gl{o,b}*.js'
    );

    mock.installFullProject('test-files');
    await plugin(truffleConfig);

    const expected = [
      {
        file: mock.pathToContract(truffleConfig, 'ContractA.sol'),
        pct: 0,
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractB.sol'),
        pct: 100,
      },
      {
        file: mock.pathToContract(truffleConfig, 'ContractC.sol'),
        pct: 100,
      },
    ];

    verify.lineCoverage(expected);
  });

  it('--config ../.solcover.js', async function() {
    solcoverConfig = {
      silent: process.env.SILENT ? true : false,
      istanbulReporter: ['json-summary', 'text']
    };

    // Write solcoverjs to parent dir of sc_temp (where the test project is installed)
    fs.writeFileSync(
      '.solcover.js',
      `module.exports=${JSON.stringify(solcoverConfig)}`
    );

    // This relative path has to be ./ prefixed (it's path.joined to truffle's working_directory)
    truffleConfig.solcoverjs = './../.solcover.js';

    mock.install('Simple', 'simple.js');
    await plugin(truffleConfig);

    // The relative solcoverjs uses the json-summary reporter
    const expected = [{
      file: mock.pathToContract(truffleConfig, 'Simple.sol'),
      pct: 100
    }];

    verify.lineCoverage(expected);
    shell.rm('.solcover.js');
  });

  it('--help', async function(){
    truffleConfig.help = "true";
    truffleConfig.logger = mock.testLogger;

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('Usage'),
      `Should output help with Usage instruction : ${mock.loggerOutput.val}`
    );
  })

  it('--version', async function(){
    truffleConfig.version = "true";
    truffleConfig.logger = mock.testLogger;

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('truffle'),
      `Should output truffle version: ${mock.loggerOutput.val}`
    );

    assert(
      mock.loggerOutput.val.includes('ganache-core'),
      `Should output ganache-core version: ${mock.loggerOutput.val}`
    );

    assert(
      mock.loggerOutput.val.includes('solidity-coverage'),
      `Should output solidity-coverage version: ${mock.loggerOutput.val}`
    );

  })

  it('--useGlobalTruffle', async function(){
    truffleConfig.useGlobalTruffle = true;
    truffleConfig.logger = mock.testLogger;

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes('global node_modules'),
      `Should notify it's using global truffle: ${mock.loggerOutput.val}`
    );
  });

  it('--temp', async function(){
    truffleConfig.logger = mock.testLogger;

    truffleConfig.temp = 'special_location';
    truffleConfig.verbose = true;

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes("/special_location/contracts"),
      `Should write artifacts to "special_location": ${mock.loggerOutput.val}`
    );
  });

  it('--network (network_id mismatch in configs)', async function(){
    truffleConfig.logger = mock.testLogger;

    solcoverConfig = { providerOptions: { network_id: 5 }}

    truffleConfig.network = 'development';
    truffleConfig.networks['development'].network_id = 7;

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes("'network_id' values"),
      `Should notify about network_id values: ${mock.loggerOutput.val}`
    );
  });

  it('--network (truffle config missing port)', async function(){
    truffleConfig.logger = mock.testLogger;

    truffleConfig.network = 'development';
    truffleConfig.networks['development'].port = undefined;

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes("No 'port' was declared"),
      `Should notify about missing port: ${mock.loggerOutput.val}`
    );

    assert(
      mock.loggerOutput.val.includes("8555"),
      `Should have used default coverage port 8555: ${mock.loggerOutput.val}`
    );
  });

  it('--network (declared port mismatches)', async function(){
    truffleConfig.logger = mock.testLogger;

    truffleConfig.network = 'development'; // 8545
    solcoverConfig = { port: 8222 }

    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    assert(
      mock.loggerOutput.val.includes("The 'port' values"),
      `Should notify about mismatched port values: ${mock.loggerOutput.val}`
    );

    assert(
      mock.loggerOutput.val.includes("8545"),
      `Should have used default coverage port 8545: ${mock.loggerOutput.val}`
    );
  });

  it('--matrix', async function(){
    process.env.TRUFFLE_TEST = true; // Path to reporter differs btw HH and Truffle
    truffleConfig.matrix = true;

    mock.installFullProject('matrix');
    await plugin(truffleConfig);

    // Integration test checks output path configurabililty
    const altPath = path.join(process.cwd(), mock.pathToTemp('./alternateTestMatrix.json'));
    const expPath = path.join(process.cwd(), mock.pathToTemp('./expectedTestMatrixHardhat.json'));

    const producedMatrix = require(altPath)
    const expectedMatrix = require(expPath);

    assert.deepEqual(producedMatrix, expectedMatrix);
    process.env.TRUFFLE_TEST = false;
  });

  it('--abi', async function(){
    const expected = [
      {
        "contractName": "Migrations",
        "humanReadableAbiList": [
         "function last_completed_migration() view returns (uint256)",
         "function owner() view returns (address)",
         "function setCompleted(uint256) nonpayable",
         "function upgrade(address) nonpayable"
        ]
      },
      {
        "contractName": "Simple",
        "humanReadableAbiList": [
         "function getX() view returns (uint256)",
         "function test(uint256) nonpayable"
        ]
      }
    ];

    truffleConfig.abi = true;
    mock.install('Simple', 'simple.js', solcoverConfig);
    await plugin(truffleConfig);

    const outputPath = path.join(process.cwd(), mock.pathToTemp('./humanReadableAbis.json'));
    const output = require(outputPath);
    assert.deepEqual(output, expected);
  })
});

