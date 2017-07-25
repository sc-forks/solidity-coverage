/* eslint-env node, mocha */

const path = require('path');
const getInstrumentedVersion = require('./../lib/instrumentSolidity.js');
const util = require('./util/util.js');
const CoverageMap = require('./../lib/coverageMap');
const vm = require('./util/vm');
const assert = require('assert');

describe('if, else, and else if statements', () => {
  const filePath = path.resolve('./test.sol');
  const pathPrefix = './';

  it('should cover an if statement with a bracketed consequent', done => {
    const contract = util.getCode('if/if-with-brackets.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    // Runs: a(1) => if (x == 1) { x = 3; }
    vm.execute(info.contract, 'a', [1]).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        5: 1,
      });
      assert.deepEqual(mapping[filePath].b, {
        1: [1, 0],
      });
      assert.deepEqual(mapping[filePath].s, {
        1: 1, 2: 1,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1,
      });
      done();
    }).catch(done);
  });

  // Runs: a(1) => if (x == 1) x = 2;
  it('should cover an unbracketed if consequent (single line)', done => {
    const contract = util.getCode('if/if-no-brackets.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    // Same results as previous test
    vm.execute(info.contract, 'a', [1]).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        5: 1,
      });
      assert.deepEqual(mapping[filePath].b, {
        1: [1, 0],
      });
      assert.deepEqual(mapping[filePath].s, {
        1: 1, 2: 1,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1,
      });
      done();
    }).catch(done);
  });

  it('should cover an if statement with multiline bracketed consequent', done => {
    const contract = util.getCode('if/if-with-brackets-multiline.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    // Runs: a(1) => if (x == 1){\n x = 3; }
    vm.execute(info.contract, 'a', [1]).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        5: 1, 6: 1,
      });
      assert.deepEqual(mapping[filePath].b, {
        1: [1, 0],
      });
      assert.deepEqual(mapping[filePath].s, {
        1: 1, 2: 1,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1,
      });
      done();
    }).catch(done);
  });

  // Runs: a(1) => if (x == 1)\n x = 3;
  it('should cover an unbracketed if consequent (multi-line)', done => {
    const contract = util.getCode('if/if-no-brackets-multiline.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);
    // Same results as previous test
    vm.execute(info.contract, 'a', [1]).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        5: 1, 6: 1,
      });
      assert.deepEqual(mapping[filePath].b, {
        1: [1, 0],
      });
      assert.deepEqual(mapping[filePath].s, {
        1: 1, 2: 1,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1,
      });
      done();
    }).catch(done);
  });

  it('should cover a simple if statement with a failing condition', done => {
    const contract = util.getCode('if/if-with-brackets.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    // Runs: a(2) => if (x == 1) { x = 3; }
    vm.execute(info.contract, 'a', [2]).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        5: 1,
      });
      assert.deepEqual(mapping[filePath].b, {
        1: [0, 1],
      });
      assert.deepEqual(mapping[filePath].s, {
        1: 1, 2: 0,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1,
      });
      done();
    }).catch(done);
  });

  // Runs: a(2) => if (x == 1){\n throw;\n }else{\n x = 5; \n}
  it('should cover an if statement with a bracketed alternate', done => {
    const contract = util.getCode('if/else-with-brackets.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    vm.execute(info.contract, 'a', [2]).then(events => {
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

  it('should cover an if statement with an unbracketed alternate', done => {
    const contract = util.getCode('if/else-without-brackets.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    vm.execute(info.contract, 'a', [2]).then(events => {
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

  it('should cover nested if statements with missing else statements', done => {
    const contract = util.getCode('if/nested-if-missing-else.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);
    vm.execute(info.contract, 'a', [2, 3, 3]).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        5: 1, 7: 1,
      });
      assert.deepEqual(mapping[filePath].b, {
        1: [0, 1], 2: [1, 0], 3: [1, 0],
      });
      assert.deepEqual(mapping[filePath].s, {
        1: 1, 2: 1, 3: 1,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1,
      });
      done();
    }).catch(done);
  });
});
