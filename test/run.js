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

describe('run', () => {
  let testrpcProcess = null;
  const script = 'node ./exec.js';
  const port = 8555;

  const config = {
    dir: './mock',
    port,
    testing: true,
    silent: true, // <-- Set to false to debug tests
    norpc: true,
  };

  before(() => {
    const command = `./node_modules/ethereumjs-testrpc-sc/bin/testrpc --gasLimit 0xfffffffffff --port ${port}`;
    testrpcProcess = childprocess.exec(command);
  });

  afterEach(() => {
    mock.remove();
  });

  after(() => {
    testrpcProcess.kill();
  });

  // This pre-test flushes the suite. There's some kind of sequencing issue here in development,
  // possibly tied to the use of ethereumjs-vm in the coverage tests?
  // - tests pass w/out this if we only run these test - e.g. it only fails when running the suite.
  // - the first test always fails unless there is a fresh testrpc install.
  it('flush test suite', () => {
    mock.install('Simple.sol', 'simple.js', config);
    shell.exec(script); // <---- This fails mysteriously, but we don't test here.
    collectGarbage();
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

  it('truffle tests failing: should generate coverage, cleanup & exit(0)', () => {
    assert(pathExists('./coverage') === false, 'should start without: coverage');
    assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');

    // Run with Simple.sol and a failing assertion in a truffle test
    mock.install('Simple.sol', 'truffle-test-fail.js', config);
    shell.exec(script);
    assert(shell.error() === null, 'script should not error');
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
