var solc = require('solc');
var getInstrumentedVersion = require('./../instrumentSolidity.js');
var util = require('./util/util.js');

/**
 * NB: passing '1' to solc as an option activates the optimiser
 * NB: solc will throw if there is a compilation error, causing the test to fail
 *     and passing the error to mocha.
 */
describe('generic statements', function(){
  it('should compile after instrumenting a single statement (first line of function)', function(){
    var contract = util.getCode('statements/single.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting multiple statements', function(){
    var contract = util.getCode('statements/multiple.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting a statement that is a function argument (single line)', function(){
    var contract = util.getCode('statements/fn-argument.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting a statement that is a function argument (multi-line)', function(){
    var contract = util.getCode('statements/fn-argument-multiline.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting a statement that is an unbracketed "if" consequent (multi-line)', function(){
    var contract = util.getCode('statements/if-consequent-no-brackets-multiline.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })
})
