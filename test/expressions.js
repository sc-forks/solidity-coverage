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
describe('generic expressions', function(){
  const filePath = path.resolve('./test.sol');
  const pathPrefix = './';

  it('should compile after instrumenting a single binary expression', function(){
    var contract = util.getCode('expressions/single-binary-expression.sol');
    var info = getInstrumentedVersion(contract, filePath, true);
    var output = solc.compile(info.contract, 1);
    util.report(output.errors);
  })

  it('should compile after instrumenting a new expression', function(){
    var contract = util.getCode('expressions/new-expression.sol');
    var info = getInstrumentedVersion(contract, filePath, true);
    var output = solc.compile(info.contract, 1);
    util.report(output.errors);
  })

})
