/* eslint-env node, mocha */

const path = require('path');
const getInstrumentedVersion = require('./../lib/instrumentSolidity.js');
const util = require('./util/util.js');
const CoverageMap = require('./../lib/coverageMap');
const vm = require('./util/vm');
const assert = require('assert');

describe('asserts and requires', () => {
  const filePath = path.resolve('./test.sol');
  const pathPrefix = './';

  it('should cover assert statements as if they are if statements when they pass', done => {
    const contract = util.getCode('assert/Assert.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    vm.execute(info.contract, 'a', [true]).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        5: 1,
      });
      assert.deepEqual(mapping[filePath].b, {
        1: [1, 0],
      });
      assert.deepEqual(mapping[filePath].s, {
        1: 1,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1,
      });
      done();
    }).catch(done);
  });

  it('should cover assert statements as if they are if statements when they fail', done => {
    const contract = util.getCode('assert/Assert.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    vm.execute(info.contract, 'a', [false]).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        5: 1,
      });
      assert.deepEqual(mapping[filePath].b, {
        1: [0, 1],
      });
      assert.deepEqual(mapping[filePath].s, {
        1: 1,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1,
      });
      done();
    }).catch(done);
  });

  it('should cover multi-line require statements as if they are if statements when they pass', done => {
    const contract = util.getCode('assert/RequireMultiline.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    vm.execute(info.contract, 'a', [true, true, true]).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        5: 1,
      });
      assert.deepEqual(mapping[filePath].b, {
        1: [1, 0],
      });
      assert.deepEqual(mapping[filePath].s, {
        1: 1,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1,
      });
      done();
    }).catch(done);
  });

  it('should cover multi-line require statements as if they are if statements when they fail', done => {
    const contract = util.getCode('assert/RequireMultiline.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    vm.execute(info.contract, 'a', [true, true, false]).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        5: 1,
      });
      assert.deepEqual(mapping[filePath].b, {
        1: [0, 1],
      });
      assert.deepEqual(mapping[filePath].s, {
        1: 1,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1,
      });
      done();
    }).catch(done);
  });
});
