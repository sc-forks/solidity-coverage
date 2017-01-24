var solc = require('solc');
var getInstrumentedVersion = require('./../instrumentSolidity.js');
var util = require('./util/util.js');
const CoverageMap = require('./../coverageMap');
const path = require('path');
const vm = require('./util/vm');
const assert = require('assert');

/**
 * NB: passing '1' to solc as an option activates the optimiser
 * NB: solc will throw if there is a compilation error, causing the test to fail
 *     and passing the error to mocha.
 */
describe('generic statements', function(){
  const filePath = path.resolve('./test.sol');
  const pathPrefix = './';


  it('should compile after instrumenting a single statement (first line of function)', function(){
    var contract = util.getCode('statements/single.sol');
    var info = getInstrumentedVersion(contract, filePath, true);
    var output = solc.compile(info.contract, 1);
    util.report(output.errors);
  })

  it('should compile after instrumenting multiple statements', function(){
    var contract = util.getCode('statements/multiple.sol');
    var info = getInstrumentedVersion(contract, filePath, true);
    var output = solc.compile(info.contract, 1);
    util.report(output.errors);
  })

  it('should compile after instrumenting a statement that is a function argument (single line)', function(){
    var contract = util.getCode('statements/fn-argument.sol');
    var info = getInstrumentedVersion(contract, filePath, true);
    var output = solc.compile(info.contract, 1);
    util.report(output.errors);
  })

  it('should compile after instrumenting a statement that is a function argument (multi-line)', function(){
    var contract = util.getCode('statements/fn-argument-multiline.sol');
    var info = getInstrumentedVersion(contract, filePath, true);
    var output = solc.compile(info.contract, 1);
    util.report(output.errors);
  })
  it('should cover a statement following a close brace', (done) => {
    const contract = util.getCode('statements/post-close-brace.sol');
    const info = getInstrumentedVersion(contract, filePath, true);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    vm.execute(info.contract, 'a', [1]).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {5: 1, 6: 0, 8: 1});
      assert.deepEqual(mapping[filePath].b, {1: [0, 1]});
      assert.deepEqual(mapping[filePath].s, {1: 1, 2: 0, 3: 1});
      assert.deepEqual(mapping[filePath].f, {1: 1});
      done();
    }).catch(done);
  });

  it('should cover a library statement and an invoked library method', (done) => {
    const contract = util.getCode('statements/library.sol');
    const info = getInstrumentedVersion(contract, filePath, true);
    const coverage = new CoverageMap();
    coverage.addContract(info, filePath);

    vm.execute(info.contract, 'not', []).then(events => {
      const mapping = coverage.generate(events, pathPrefix);
      assert.deepEqual(mapping[filePath].l, {9: 1, 10: 1, 19: 1});
      assert.deepEqual(mapping[filePath].b, {});
      assert.deepEqual(mapping[filePath].s, {1: 1, 2: 1, 3: 1});
      assert.deepEqual(mapping[filePath].f, {1: 1, 2: 1});
      done();
    }).catch(done);
  });
})
