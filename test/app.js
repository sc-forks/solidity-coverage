/* eslint-env node, mocha */

const assert = require('assert');
const shell = require('shelljs');
const fs = require('fs');
const childprocess = require('child_process');
const mock = require('./util/mockTruffle.js');

// shell.test alias for legibility
function pathExists(path) { return shell.test('-e', path); }

// tests run out of memory in CI without this
function collectGarbage() {
  if (global.gc) { global.gc(); }
}

describe('app', () => {
  let testrpcProcess = null;
  const script = 'node ./bin/exec.js';
  const port = 8555;

  const config = {
    dir: './mock',
    port,
    testing: true,
    silent: true, // <-- Set to false to debug tests
    norpc: true,
  };

  before(done => {
    const command = `./node_modules/.bin/testrpc-sc --gasLimit 0xfffffffffff --port ${port}`;
    testrpcProcess = childprocess.exec(command);

    testrpcProcess.stdout.on('data', data => {
      if (data.includes('Listening')) {
        done();
      }
    });
  });

  afterEach(() => {
    mock.remove();
  });

  after(() => {
    testrpcProcess.kill();
  });

  // #1: The 'config' tests ask exec.js to run testrpc on special ports, the subsequent tests use
  // the testrpc launched in the before() block. For some reason config tests fail randomly
  // unless they are at the top of the suite. Hard to debug since they pass if logging is turned
  // on - there might be a timing issue around resource cleanup or something.
  //
  // #2: Creating repeated instances of testrpc hits the container memory limit on
  // CI so these tests are disabled for that context
  it('config with testrpc options string: should generate coverage, cleanup & exit(0)', () => {
    if (!process.env.CI) {
      const privateKey = '0x3af46c9ac38ee1f01b05f9915080133f644bf57443f504d339082cb5285ccae4';
      const balance = '0xfffffffffffffff';
      const testConfig = Object.assign({}, config);

      testConfig.testrpcOptions = `--account="${privateKey},${balance}" --port 8777`;
      testConfig.dir = './mock';
      testConfig.norpc = false;
      testConfig.port = 8777;

      // Installed test will process.exit(1) and crash truffle if the test isn't
      // loaded with the account specified above
      mock.install('Simple.sol', 'testrpc-options.js', testConfig);
      shell.exec(script);
      assert(shell.error() === null, 'script should not error');
      collectGarbage();
    }
  });

  it('config with test command options string: should run test', () => {
    if (!process.env.CI) {
      assert(pathExists('./allFiredEvents') === false, 'should start without: events log');
      const testConfig = Object.assign({}, config);

      testConfig.testCommand = 'mocha --timeout 5000';
      testConfig.dir = './mock';
      testConfig.norpc = false;
      testConfig.port = 8888;

      // Installed test will write a fake allFiredEvents to ./ after 4000ms
      // allowing test to pass
      mock.install('Simple.sol', 'command-options.js', testConfig);
      shell.exec(script);
      assert(shell.error() === null, 'script should not error');
      collectGarbage();
    }
  });

  it('config racing test command: should run test after testrpc has started', () => {
    if (!process.env.CI) {
      assert(pathExists('./allFiredEvents') === false, 'should start without: events log');
      const testConfig = Object.assign({}, config);

      testConfig.testCommand = 'node ../test/util/mockTestCommand.js';
      testConfig.dir = './mock';
      testConfig.norpc = false;
      testConfig.port = 8888;

      // Installed test will write a fake allFiredEvents to ./ after 4000ms
      // allowing test to pass
      mock.install('Simple.sol', 'command-options.js', testConfig);
      shell.exec(script);
      assert(shell.error() === null, 'script should not error');
      collectGarbage();
    }
  });

  it('contract tests events: tests should pass without errors', () => {
    if (!process.env.CI) {
      assert(pathExists('./coverage') === false, 'should start without: coverage');
      assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');

      const testConfig = Object.assign({}, config);

      testConfig.dir = './mock';
      testConfig.norpc = false;
      testConfig.port = 8889;

      mock.install('Events.sol', 'events.js', testConfig);
      shell.exec(script);
      assert(shell.error() === null, 'script should not error');

      // Directory should have coverage report
      assert(pathExists('./coverage') === true, 'script should gen coverage folder');
      assert(pathExists('./coverage.json') === true, 'script should gen coverage.json');

      // Coverage should be real.
      // This test is tightly bound to the function names in Simple.sol
      const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
      const path = Object.keys(produced)[0];
      assert(produced[path].fnMap['1'].name === 'test', 'coverage.json should map "test"');
      assert(produced[path].fnMap['2'].name === 'getX', 'coverage.json should map "getX"');
      collectGarbage();
    }
  });

  it('trufflejs specifies coverage network: should generate coverage, cleanup and exit(0)', () => {
    if (!process.env.CI) {
      const trufflejs =
      `module.exports = {
        networks: {
          development: {
            host: "localhost",
            port: 8545,
            network_id: "*"
          },
          coverage: {
            host: "localhost",
            port: 8999,
            network_id: "*"
          }
        }
      };`;

      const testConfig = Object.assign({}, config);
      testConfig.dir = './mock';
      testConfig.norpc = false;
      testConfig.port = 8555; // Manually inspect that port is actually set to 8999

      // Directory should be clean
      assert(pathExists('./coverage') === false, 'should start without: coverage');
      assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');

      // Run script (exits 0);
      mock.install('Simple.sol', 'simple.js', testConfig, trufflejs);
      shell.exec(script);
      assert(shell.error() === null, 'script should not error');

      // Directory should have coverage report
      assert(pathExists('./coverage') === true, 'script should gen coverage folder');
      assert(pathExists('./coverage.json') === true, 'script should gen coverage.json');

      // Coverage should be real.
      // This test is tightly bound to the function names in Simple.sol
      const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
      const path = Object.keys(produced)[0];
      assert(produced[path].fnMap['1'].name === 'test', 'coverage.json should map "test"');
      assert(produced[path].fnMap['2'].name === 'getX', 'coverage.json should map "getX"');
      collectGarbage();
    }
  });

  it('simple contract: should generate coverage, cleanup & exit(0)', () => {
    // Directory should be clean
    assert(pathExists('./coverage') === false, 'should start without: coverage');
    assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');

    // Run script (exits 0);
    mock.install('Simple.sol', 'simple.js', config);
    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

    // Directory should have coverage report
    assert(pathExists('./coverage') === true, 'script should gen coverage folder');
    assert(pathExists('./coverage.json') === true, 'script should gen coverage.json');

    // Coverage should be real.
    // This test is tightly bound to the function names in Simple.sol
    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const path = Object.keys(produced)[0];
    assert(produced[path].fnMap['1'].name === 'test', 'coverage.json should map "test"');
    assert(produced[path].fnMap['2'].name === 'getX', 'coverage.json should map "getX"');
    collectGarbage();
  });

  it('project uses truffle-config.js: should generate coverage, cleanup and exit(0)', () => {
    // Directory should be clean
    assert(pathExists('./coverage') === false, 'should start without: coverage');
    assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');

    // Run script (exits 0);
    mock.install('Simple.sol', 'simple.js', config, null, 'truffle-config.js');
    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

    // Directory should have coverage report
    assert(pathExists('./coverage') === true, 'script should gen coverage folder');
    assert(pathExists('./coverage.json') === true, 'script should gen coverage.json');

    // Coverage should be real.
    // This test is tightly bound to the function names in Simple.sol
    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const path = Object.keys(produced)[0];
    assert(produced[path].fnMap['1'].name === 'test', 'coverage.json should map "test"');
    assert(produced[path].fnMap['2'].name === 'getX', 'coverage.json should map "getX"');
    collectGarbage();
  });

  it('testrpc-sc signs and recovers messages correctly', () => {
    // sign.js signs and recovers
    mock.install('Simple.sol', 'sign.js', config);
    shell.exec(script);
    assert(shell.error() === null, 'script should not error');
    collectGarbage();
  });

  it('tests use pure and view modifiers, including with libraries', () => {
    // Directory should be clean
    assert(pathExists('./coverage') === false, 'should start without: coverage');
    assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');

    // Run script (exits 0);
    mock.installLibraryTest(config);
    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

    // Directory should have coverage report
    assert(pathExists('./coverage') === true, 'script should gen coverage folder');
    assert(pathExists('./coverage.json') === true, 'script should gen coverage.json');

    // Coverage should be real.
    // This test is tightly bound to the function names in TotallyPure.sol
    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const path = Object.keys(produced)[0];
    assert(produced[path].fnMap['1'].name === 'usesThem', 'coverage.json should map "usesThem"');
    assert(produced[path].fnMap['2'].name === 'isPure', 'coverage.json should map "getX"');
    collectGarbage();
  });

  it('tests require assets outside of test folder: should generate coverage, cleanup & exit(0)', () => {
    // Directory should be clean
    assert(pathExists('./coverage') === false, 'should start without: coverage');
    assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');

    // Run script (exits 0);
    mock.install('Simple.sol', 'requires-externally.js', config);
    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

    // Directory should have coverage report
    assert(pathExists('./coverage') === true, 'script should gen coverage folder');
    assert(pathExists('./coverage.json') === true, 'script should gen coverage.json');

    // Coverage should be real.
    // This test is tightly bound to the function names in Simple.sol
    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const path = Object.keys(produced)[0];
    assert(produced[path].fnMap['1'].name === 'test', 'coverage.json should map "test"');
    assert(produced[path].fnMap['2'].name === 'getX', 'coverage.json should map "getX"');
    collectGarbage();
  });

  it('contract only uses .call: should generate coverage, cleanup & exit(0)', () => {
    // Run against contract that only uses method.call.
    assert(pathExists('./coverage') === false, 'should start without: coverage');
    assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');
    mock.install('OnlyCall.sol', 'only-call.js', config);

    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

    assert(pathExists('./coverage') === true, 'script should gen coverage folder');
    assert(pathExists('./coverage.json') === true, 'script should gen coverage.json');

    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const path = Object.keys(produced)[0];
    assert(produced[path].fnMap['1'].name === 'addTwo', 'coverage.json should map "addTwo"');
    collectGarbage();
  });

  it.skip('contract sends / transfers to instrumented fallback: coverage, cleanup & exit(0)', () => {
    // Validate ethereumjs-vm hack to remove gas constraints on transfer() and send()
    assert(pathExists('./coverage') === false, 'should start without: coverage');
    assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');

    mock.install('Wallet.sol', 'wallet.js', config);
    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

    assert(pathExists('./coverage') === true, 'script should gen coverage folder');
    assert(pathExists('./coverage.json') === true, 'script should gen coverage.json');

    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const path = Object.keys(produced)[0];
    assert(produced[path].fnMap['1'].name === 'transferPayment', 'should map "transferPayment"');
    collectGarbage();
  });

  it('contract uses inheritance: should generate coverage, cleanup & exit(0)', () => {
    // Run against a contract that 'is' another contract
    assert(pathExists('./coverage') === false, 'should start without: coverage');
    assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');
    mock.installInheritanceTest(config);

    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

    assert(pathExists('./coverage') === true, 'script should gen coverage folder');
    assert(pathExists('./coverage.json') === true, 'script should gen coverage.json');

    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const ownedPath = Object.keys(produced)[0];
    const proxyPath = Object.keys(produced)[1];

    assert(produced[ownedPath].fnMap['1'].name === 'Owned', 'coverage.json should map "Owned"');
    assert(produced[proxyPath].fnMap['1'].name === 'isOwner', 'coverage.json should map "isOwner"');
    collectGarbage();
  });

  it('contracts are skipped: should generate coverage, cleanup & exit(0)', () => {
    // Skip instrumentation of some contracts
    assert(pathExists('./coverage') === false, 'should start without: coverage');
    assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');
    const testConfig = Object.assign({}, config);

    testConfig.skipFiles = ['Owned.sol'];
    mock.installInheritanceTest(testConfig);

    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

    assert(pathExists('./coverage') === true, 'script should gen coverage folder');
    assert(pathExists('./coverage.json') === true, 'script should gen coverage.json');

    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const firstKey = Object.keys(produced)[0];
    assert(Object.keys(produced).length === 1, 'coverage.json should only contain instrumentation for one contract');
    assert(firstKey.substr(firstKey.length - 9) === 'Proxy.sol', 'coverage.json should only contain instrumentation for Proxy.sol');
    collectGarbage();
  });

  it('truffle tests failing: should generate coverage, cleanup & exit(1)', () => {
    assert(pathExists('./coverage') === false, 'should start without: coverage');
    assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');

    // Run with Simple.sol and a failing assertion in a truffle test
    mock.install('Simple.sol', 'truffle-test-fail.js', config);
    shell.exec(script);
    assert(shell.error() !== null, 'script should exit 1');
    assert(pathExists('./coverage') === true, 'script should gen coverage folder');
    assert(pathExists('./coverage.json') === true, 'script should gen coverage.json');

    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const path = Object.keys(produced)[0];
    assert(produced[path].fnMap['1'].name === 'test', 'coverage.json should map "test"');
    assert(produced[path].fnMap['2'].name === 'getX', 'coverage.json should map "getX"');
    collectGarbage();
  });

  it('deployment cost > block gasLimit: should generate coverage, cleanup & exit(0)', () => {
    // Just making sure Expensive.sol compiles and deploys here.
    mock.install('Expensive.sol', 'block-gas-limit.js', config);
    shell.exec(script);
    assert(shell.error() === null, 'script should not error');
    collectGarbage();
  });

  it('truffle crashes: should generate NO coverage, cleanup and exit(1)', () => {
    assert(pathExists('./coverage') === false, 'should start without: coverage');
    assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');

    // Run with Simple.sol and a syntax error in the truffle test
    mock.install('Simple.sol', 'truffle-crash.js', config);
    shell.exec(script);
    assert(shell.error() !== null, 'script should error');
    assert(pathExists('./coverage') !== true, 'script should NOT gen coverage folder');
    assert(pathExists('./coverage.json') !== true, 'script should NOT gen coverage.json');
    collectGarbage();
  });

  it('instrumentation errors: should generate NO coverage, cleanup and exit(1)', () => {
    assert(pathExists('./coverage') === false, 'should start without: coverage');
    assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');

    // Run with SimpleError.sol (has syntax error) and working truffle test
    mock.install('SimpleError.sol', 'simple.js', config);
    shell.exec(script);
    assert(shell.error() !== null, 'script should error');
    assert(pathExists('./coverage') !== true, 'script should NOT gen coverage folder');
    assert(pathExists('./coverage.json') !== true, 'script should NOT gen coverage.json');
    collectGarbage();
  });

  it('no events log produced: should generate NO coverage, cleanup and exit(1)', () => {
    // Run contract and test that pass but fire no events
    assert(pathExists('./coverage') === false, 'should start without: coverage');
    assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');
    mock.install('Empty.sol', 'empty.js', config);
    shell.exec(script);
    assert(shell.error() !== null, 'script should error');
    assert(pathExists('./coverage') !== true, 'script should NOT gen coverage folder');
    assert(pathExists('./coverage.json') !== true, 'script should NOT gen coverage.json');
    collectGarbage();
  });
});
