/* eslint-env node, mocha */

const solc = require('solc');
const getInstrumentedVersion = require('./../lib/instrumentSolidity.js');
const util = require('./util/util.js');
const path = require('path');
const CoverageMap = require('./../lib/coverageMap');
const vm = require('./util/vm');
const assert = require('assert');

/**
 * NB: passing '1' to solc as an option activates the optimiser
 * NB: solc will throw if there is a compilation error, causing the test to fail
 *     and passing the error to mocha.
 */
describe('function declarations', () => {
  const filePath = path.resolve('./test.sol');
  const pathPrefix = './';

  it('should compile after instrumenting an ordinary function declaration', () => {
    const contract = util.getCode('function/function.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting an abstract function declaration', () => {
    const contract = util.getCode('function/abstract.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting a function declaration with an empty body', () => {
    const contract = util.getCode('function/empty-body.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting lots of declarations in row', () => {
    const contract = util.getCode('function/multiple.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting a new->constructor-->method chain', () => {
    const contract = util.getCode('function/chainable-new.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting a constructor call that chains to a method call', () => {
    const contract = util.getCode('function/chainable.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting a constructor-->method-->value chain', () => {
    const contract = util.getCode('function/chainable-value.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should cover a simple invoked function call', done => {
    const contract = util.getCode('function/function-call.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    vm.execute(info.contract, 'a', []).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        7: 1,
      });
      assert.deepEqual(mapping[filePath].b, {});
      assert.deepEqual(mapping[filePath].s, {
        1: 1,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1,
        2: 1,
      });
      done();
    }).catch(done);
  });

  it('should cover a constructor call that chains to a method call', done => {
    const contract = util.getCode('function/chainable.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);
    // We try and call a contract at an address where it doesn't exist and the VM
    // throws, but we can verify line / statement / fn coverage is getting mapped.
    vm.execute(info.contract, 'a', []).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        9: 1,
      });
      assert.deepEqual(mapping[filePath].b, {});
      assert.deepEqual(mapping[filePath].s, {
        1: 1,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 0,
        2: 1,
      });
      done();
    }).catch(done);
  });

  it('should cover a constructor call that chains to a method call', done => {
    const contract = util.getCode('function/chainable-value.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);
    // The vm runs out of gas here - but we can verify line / statement / fn
    // coverage is getting mapped.
    vm.execute(info.contract, 'a', []).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        10: 1,
      });
      assert.deepEqual(mapping[filePath].b, {});
      assert.deepEqual(mapping[filePath].s, {
        1: 1,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 0,
        2: 1,
      });
      done();
    }).catch(done);
  });
});
