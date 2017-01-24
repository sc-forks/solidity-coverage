/* eslint-env node, mocha */

const solc = require('solc');
const path = require('path');
const getInstrumentedVersion = require('./../instrumentSolidity.js');
const util = require('./util/util.js');
const CoverageMap = require('./../coverageMap');
const vm = require('./util/vm');
const assert = require('assert');

describe('for and while statements', () => {
  const filePath = path.resolve('./test.sol');
  const pathPrefix = './';

  it('should cover a for statement with a bracketed body (multiline)', done => {
    const contract = util.getCode('loops/for-with-brackets.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    // Runs: a() => for(var x = 1; x < 10; x++){\n sha3(x);\n }
    vm.execute(info.contract, 'a', []).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        5: 1, 6: 10,
      });
      assert.deepEqual(mapping[filePath].b, {});
      assert.deepEqual(mapping[filePath].s, {
        1: 1, 2: 10,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1,
      });
      done();
    }).catch(done);
  });

  it('should cover a for statement with an unbracketed body', done => {
    const contract = util.getCode('loops/for-no-brackets.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    // Runs: a() => for(var x = 1; x < 10; x++)\n sha3(x);\n
    vm.execute(info.contract, 'a', []).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        5: 1, 6: 10,
      });
      assert.deepEqual(mapping[filePath].b, {});
      assert.deepEqual(mapping[filePath].s, {
        1: 1, 2: 10,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1,
      });
      done();
    }).catch(done);
  });

  it('should cover a while statement with an bracketed body (multiline)', done => {
    const contract = util.getCode('loops/while-with-brackets.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    // Runs: a() => var t = true;\n while(t){\n t = false;\n }
    vm.execute(info.contract, 'a', []).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        5: 1, 6: 1, 7: 1,
      });
      assert.deepEqual(mapping[filePath].b, {});
      assert.deepEqual(mapping[filePath].s, {
        1: 1, 2: 1, 3: 1,
      });
      assert.deepEqual(mapping[filePath].f, {
        1: 1,
      });
      done();
    }).catch(done);
  });

  it('should cover a while statement with an unbracketed body (multiline)', done => {
    const contract = util.getCode('loops/while-no-brackets.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    // Runs: a() => var t = true;\n while(t)\n t = false;\n
    vm.execute(info.contract, 'a', []).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {
        5: 1, 6: 1, 7: 1,
      });
      assert.deepEqual(mapping[filePath].b, {});
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
