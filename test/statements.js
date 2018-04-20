/* eslint-env node, mocha */

const solc = require('solc');
const getInstrumentedVersion = require('./../lib/instrumentSolidity.js');
const util = require('./util/util.js');
const CoverageMap = require('./../lib/coverageMap');
const path = require('path');
const vm = require('./util/vm');
const assert = require('assert');

/**
 * NB: passing '1' to solc as an option activates the optimiser
 * NB: solc will throw if there is a compilation error, causing the test to fail
 *     and passing the error to mocha.
 */
describe('generic statements', () => {
  const filePath = path.resolve('./test.sol');
  const pathPrefix = './';

  it('should compile function defined in a struct', () => {
    const contract = util.getCode('statements/fn-struct.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  })

  it('should compile after instrumenting a single statement (first line of function)', () => {
    const contract = util.getCode('statements/single.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting multiple statements', () => {
    const contract = util.getCode('statements/multiple.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting a statement that is a function argument (single line)', () => {
    const contract = util.getCode('statements/fn-argument.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting a statement that is a function argument (multi-line)', () => {
    const contract = util.getCode('statements/fn-argument-multiline.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting an empty-contract-body', () => {
    const contract = util.getCode('statements/empty-contract-ala-melonport.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });



  it('should NOT pass tests if the contract has a compilation error', () => {
    const contract = util.getCode('statements/compilation-error.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const output = solc.compile(info.contract, 1);
    try {
      util.report(output.errors);
      assert.fail('WRONG'); // We shouldn't hit this.
    } catch (err) {
      (err.actual === 'WRONG') ? assert(false) : assert(true);
    }
  });

  it('should compile after instrumenting an emit statement after an un-enclosed if statement', () => {
    const contract = util.getCode('statements/emit-instrument.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should cover an emitted event statement', done => {
    const contract = util.getCode('statements/emit-coverage.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    vm.execute(info.contract, 'a', []).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        6: 1
      });
      assert.deepEqual(mapping[filePath].b, {});
      assert.deepEqual(mapping[filePath].s, {
        1: 1
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1,
      });
      done();
    }).catch(done);
  });

  it('should cover a statement following a close brace', done => {
    const contract = util.getCode('statements/post-close-brace.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    vm.execute(info.contract, 'a', [1]).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        5: 1, 6: 0, 8: 1,
      });
      assert.deepEqual(mapping[filePath].b, {
        1: [0, 1],
      });
      assert.deepEqual(mapping[filePath].s, {
        1: 1, 2: 0, 3: 1,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1,
      });
      done();
    }).catch(done);
  });

  it('should cover a library statement and an invoked library method', done => {
    const contract = util.getCode('statements/library.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    vm.execute(info.contract, 'not', []).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        9: 1, 10: 1, 19: 1,
      });
      assert.deepEqual(mapping[filePath].b, {});
      assert.deepEqual(mapping[filePath].s, {
        1: 1, 2: 1, 3: 1,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1, 2: 1,
      });
      done();
    }).catch(done);
  });

  it('should cover a tuple statement', done => {
    const contract = util.getCode('statements/tuple.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    vm.execute(info.contract, 'a', []).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        6: 1, 10: 1, 11: 1,
      });
      assert.deepEqual(mapping[filePath].b, {});
      assert.deepEqual(mapping[filePath].s, {
        1: 1, 2: 1, 3: 1,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1, 2: 1,
      });
      done();
    }).catch(done);
  });

  it('should cover an empty bodied contract statement', done => {
    const contract = util.getCode('statements/empty-contract-body.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    vm.execute(info.contract, null, []).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {});
      assert.deepEqual(mapping[filePath].b, {});
      assert.deepEqual(mapping[filePath].s, {});
      assert.deepEqual(mapping[filePath].f, {});
      done();
    }).catch(done);
  });
});
