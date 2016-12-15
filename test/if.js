var solc = require('solc');
var getInstrumentedVersion = require('./../instrumentSolidity.js');
var util = require('./util/util.js')

/**
 * NB: passing '1' to solc as an option activates the optimiser
 */
describe('if, else, and else if statements', function(){

  it('should compile after instrumenting else statements with brackets',function(){
    var contract = util.getCode('if/else-with-brackets.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting else statements without brackets',function(){
    var contract = util.getCode('if/else-without-brackets.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting if statements with no brackets',function(){
    var contract = util.getCode('if/if-no-brackets.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting if statements with brackets',function(){
    var contract = util.getCode('if/if-with-brackets.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting nested if statements with missing else statements',function(){
    var contract = util.getCode('if/nested-if-missing-else.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })
})