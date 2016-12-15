var solc = require('solc');
var getInstrumentedVersion = require('./../instrumentSolidity.js');
var util = require('./util/util.js');

/**
 * NB: passing '1' to solc as an option activates the optimiser
 * NB: solc will throw if there is a compilation error, causing the test to fail
 *     and passing the error to mocha.
 */
describe('function declarations', function(){

  it('should compile after instrumenting an ordinary function declaration', function(){
    var contract = util.getCode('function/function.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting an abstract function declaration', function(){
    var contract = util.getCode('function/abstract.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting a function declaration with an empty body', function(){
    var contract = util.getCode('function/empty-body.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting lots of declarations in row', function(){
    var contract = util.getCode('function/multiple.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })
})
