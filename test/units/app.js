/* eslint-env node, mocha */

const assert = require('assert');
const shell = require('shelljs');
const fs = require('fs');
const childprocess = require('child_process');
const mock = require('../util/mockTruffle.js');

// shell.test alias for legibility
function pathExists(path) { return shell.test('-e', path); }

function assertCleanInitialState(){
  assert(pathExists('./coverage') === false, 'should start without: coverage');
  assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');
}

function assertCoverageGenerated(){
  assert(pathExists('./coverage') === true, 'script should gen coverage folder');
  assert(pathExists('./coverage.json') === true, 'script should gen coverage.json');
}

function assertCoverageNotGenerated(){
  assert(pathExists('./coverage') !== true, 'script should NOT gen coverage folder');
  assert(pathExists('./coverage.json') !== true, 'script should NOT gen coverage.json');
}

function assertExecutionSucceeds(){

}

function assertExecutionFails(){

}

describe.skip('app', function() {
  afterEach(() => mock.remove());

  it('simple contract: should generate coverage, cleanup & exit(0)', () => {
    assertCleanInitialState();

    // Run script (exits 0);
    mock.install('Simple.sol', 'simple.js', config);
    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

    assertCoverageGenerated();

    // Coverage should be real.
    // This test is tightly bound to the function names in Simple.sol
    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const path = Object.keys(produced)[0];
    assert(produced[path].fnMap['1'].name === 'test', 'coverage.json should map "test"');
    assert(produced[path].fnMap['2'].name === 'getX', 'coverage.json should map "getX"');

  });

  it('config with testrpc options string: should generate coverage, cleanup & exit(0)', () => {

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

  });

  it('config with test command options string: should run test', () => {
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

  });

  it('Oraclize @ solc v.0.4.24 (large, many unbracketed statements)', () => {
    const trufflejs =
    `module.exports = {
      networks: {
        coverage: {
          host: "localhost",
          network_id: "*",
          port: 8555,
          gas: 0xfffffffffff,
          gasPrice: 0x01
        },
      },
      compilers: {
        solc: {
          version: "0.4.24",
        }
      }
    };`;

    assertCleanInitialState();

    // Run script (exits 0);
    mock.install('Oraclize.sol', 'oraclize.js', config, trufflejs, null, true);
    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

  });

  it('tests use pure and view modifiers, including with libraries', () => {
    assertCleanInitialState();

    // Run script (exits 0);
    mock.installLibraryTest(config);
    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

    assertCoverageGenerated();

    // Coverage should be real.
    // This test is tightly bound to the function names in TotallyPure.sol
    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const path = Object.keys(produced)[0];
    assert(produced[path].fnMap['1'].name === 'usesThem', 'coverage.json should map "usesThem"');
    assert(produced[path].fnMap['2'].name === 'isPure', 'coverage.json should map "getX"');

  });

  it('tests require assets outside of test folder: should generate coverage, cleanup & exit(0)', () => {
    assertCleanInitialState();

    // Run script (exits 0);
    mock.install('Simple.sol', 'requires-externally.js', config);
    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

    assertCoverageGenerated();

    // Coverage should be real.
    // This test is tightly bound to the function names in Simple.sol
    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const path = Object.keys(produced)[0];
    assert(produced[path].fnMap['1'].name === 'test', 'coverage.json should map "test"');
    assert(produced[path].fnMap['2'].name === 'getX', 'coverage.json should map "getX"');

  });

  it('contract only uses .call: should generate coverage, cleanup & exit(0)', () => {
    assertCleanInitialState();

    mock.install('OnlyCall.sol', 'only-call.js', config);

    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

    assertCoverageGenerated();

    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const path = Object.keys(produced)[0];
    assert(produced[path].fnMap['1'].name === 'addTwo', 'coverage.json should map "addTwo"');

  });

  it('contract sends / transfers to instrumented fallback: coverage, cleanup & exit(0)', () => {
    assertCleanInitialState();

    mock.install('Wallet.sol', 'wallet.js', config);
    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

    assertCoverageGenerated();

    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const path = Object.keys(produced)[0];
    assert(produced[path].fnMap['1'].name === 'transferPayment', 'should map "transferPayment"');

  });

  it('contract uses inheritance: should generate coverage, cleanup & exit(0)', () => {
    assertCleanInitialState();

    mock.installInheritanceTest(config);
    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

    assertCoverageGenerated();

    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const ownedPath = Object.keys(produced)[0];
    const proxyPath = Object.keys(produced)[1];
    assert(produced[ownedPath].fnMap['1'].name === 'constructor', 'coverage.json should map "constructor"');
    assert(produced[proxyPath].fnMap['1'].name === 'isOwner', 'coverage.json should map "isOwner"');
  });

  it('contracts are skipped: should generate coverage, cleanup & exit(0)', () => {
    assertCleanInitialState();

    const testConfig = Object.assign({}, config);

    testConfig.skipFiles = ['Owned.sol'];
    mock.installInheritanceTest(testConfig);

    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

    assertCoverageGenerated();

    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const firstKey = Object.keys(produced)[0];
    assert(Object.keys(produced).length === 1, 'coverage.json should only contain instrumentation for one contract');
    assert(firstKey.substr(firstKey.length - 9) === 'Proxy.sol', 'coverage.json should only contain instrumentation for Proxy.sol');

  });

  it('truffle tests failing: should generate coverage, cleanup & exit(1)', () => {
    assertCleanInitialState();

    // Run with Simple.sol and a failing assertion in a truffle test
    mock.install('Simple.sol', 'truffle-test-fail.js', config);
    shell.exec(script);
    assert(shell.error() !== null, 'script should exit 1');

    assertCoverageGenerated();

    const produced = JSON.parse(fs.readFileSync('./coverage.json', 'utf8'));
    const path = Object.keys(produced)[0];
    assert(produced[path].fnMap['1'].name === 'test', 'coverage.json should map "test"');
    assert(produced[path].fnMap['2'].name === 'getX', 'coverage.json should map "getX"');

  });

  it('deployment cost > block gasLimit: should generate coverage, cleanup & exit(0)', () => {
    // Just making sure Expensive.sol compiles and deploys here.
    mock.install('Expensive.sol', 'block-gas-limit.js', config);
    shell.exec(script);
    assert(shell.error() === null, 'script should not error');

  });

  it('truffle crashes: should generate NO coverage, cleanup and exit(1)', () => {
    assertCleanInitialState();

    // Run with Simple.sol and a syntax error in the truffle test
    mock.install('Simple.sol', 'truffle-crash.js', config);
    shell.exec(script);
    assert(shell.error() !== null, 'script should error');
    assertCoverageNotGenerated();
  });

  it('instrumentation errors: should generate NO coverage, cleanup and exit(1)', () => {
    assertCleanInitialState();

    // Run with SimpleError.sol (has syntax error) and working truffle test
    mock.install('SimpleError.sol', 'simple.js', config);
    shell.exec(script);
    assert(shell.error() !== null, 'script should error');
    assertCoverageNotGenerated();
  });

});
