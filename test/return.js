var solc = require('solc');
var getInstrumentedVersion = require('./../instrumentSolidity.js');
var util = require('./util/util.js');

describe('return statements', function(){

  it('should compile after instrumenting function that returns true',function(){
    var contract = util.getCode('return/return.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors); 
  })

  it('should compile after instrumenting function that returns without specifying val (null)',function(){
    var contract = util.getCode('return/return-null.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })
})