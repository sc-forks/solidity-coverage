var solc = require('solc');
var getInstrumentedVersion = require('./../instrumentSolidity.js');
var util = require('./util/util.js');

describe('Battery test of production contracts: OpenZeppelin', function(){

  it('should compile after instrumenting zeppelin-solidity/Bounty.sol',function(){
    var contract = util.getCode('zeppelin/Bounty.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var inputs = {
      'PullPayment.sol': util.getCode('zeppelin/PullPayment.sol'),
      'Killable.sol': util.getCode('zeppelin/Killable.sol'),
      'Bounty.sol': info.contract
    };
    var output = solc.compile(inputs, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting zeppelin-solidity/Claimable.sol',function(){  
    var contract = util.getCode('zeppelin/Claimable.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var inputs = {
      'Ownable.sol': util.getCode('zeppelin/Ownable.sol'),
      'Claimable.sol': info.contract
    };
    var output = solc.compile(inputs, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting zeppelin-solidity/DayLimit.sol',function(){ 
    var contract = util.getCode('zeppelin/DayLimit.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var inputs = {
      'Ownable.sol': util.getCode('zeppelin/Shareable.sol'),
      'DayLimit.sol': info.contract
    };
    var output = solc.compile(inputs, 1);  
    util.report(output.errors);
  })

  it('should compile after instrumenting zeppelin-solidity/Killable.sol',function(){
    var contract = util.getCode('zeppelin/Killable.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var inputs = {
      'Ownable.sol': util.getCode('zeppelin/Ownable.sol'),
      'Killable.sol': info.contract
    };
    var output = solc.compile(inputs, 1); 
    util.report(output.errors); 
  })

  it('should compile after instrumenting zeppelin-solidity/LimitBalance.sol',function(){
    var contract = util.getCode('zeppelin/LimitBalance.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting zeppelin-solidity/Migrations.sol',function(){
    var contract = util.getCode('zeppelin/Migrations.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var inputs = {
      'Ownable.sol': util.getCode('zeppelin/Ownable.sol'),
      'Migrations.sol': info.contract
    };
    var output = solc.compile(inputs, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting zeppelin-solidity/Multisig.sol',function(){
    var contract = util.getCode('zeppelin/Multisig.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting zeppelin-solidity/MultisigWallet.sol',function(){
    var contract = util.getCode('zeppelin/MultisigWallet.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var inputs = {
      'Multisig.sol': util.getCode('zeppelin/Multisig.sol'),
      'Shareable.sol': util.getCode('zeppelin/Shareable.sol'),
      'DayLimit.sol': util.getCode('zeppelin/DayLimit.sol'),
      'MultisigWallet.sol': info.contract
    };
    var output = solc.compile(inputs, 1);
    util.report(output.errors); 
  })

  it('should compile after instrumenting zeppelin-solidity/Ownable.sol',function(){
    var contract = util.getCode('zeppelin/Ownable.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors); 
  })

  it('should compile after instrumenting zeppelin-solidity/PullPayment.sol',function(){
    var contract = util.getCode('zeppelin/PullPayment.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors); 
  })

  it('should compile after instrumenting zeppelin-solidity/SafeMath.sol',function(){
    var contract = util.getCode('zeppelin/SafeMath.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting zeppelin-solidity/Shareable.sol',function(){
    var contract = util.getCode('zeppelin/Shareable.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors); 
  })

  it('should compile after instrumenting zeppelin-solidity/Stoppable.sol',function(){
    var contract = util.getCode('zeppelin/Stoppable.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var inputs = {
      'Ownable.sol': util.getCode('zeppelin/Ownable.sol'),
      'Stoppable.sol': info.contract
    };
    var output = solc.compile(inputs, 1);
    util.report(output.errors);
  })
  //--- Tokens ---
  it('should compile after instrumenting zeppelin-solidity/BasicToken.sol',function(){
    var contract = util.getCode('zeppelin/token/BasicToken.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var inputs = {
      'ERC20Basic.sol': util.getCode('zeppelin/token/ERC20Basic.sol'),
      'SafeMath.sol': util.getCode('zeppelin/SafeMath.sol'),
      'BasicToken.sol': info.contract
    };
    var output = solc.compile(inputs, 1); 
    util.report(output.errors);
  })

  it('should compile after instrumenting zeppelin-solidity/CrowdsaleToken.sol',function(){
    var contract = util.getCode('zeppelin/token/CrowdsaleToken.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var inputs = {
      'StandardToken.sol': util.getCode('zeppelin/token/StandardToken.sol'),
      'CrowdsaleToken.sol': info.contract
    }; 
    var output = solc.compile(inputs, 1);
    util.report(output.errors); 
  })

  it('should compile after instrumenting zeppelin-solidity/ERC20.sol',function(){
    var contract = util.getCode('zeppelin/token/ERC20.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors); 
  })

  it('should compile after instrumenting zeppelin-solidity/ERC20Basic.sol',function(){
    var contract = util.getCode('zeppelin/token/ERC20Basic.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var output = solc.compile(info.contract, 1); 
    util.report(output.errors); 
  })

  it('should compile after instrumenting zeppelin-solidity/SimpleToken.sol',function(){
    var contract = util.getCode('zeppelin/token/SimpleToken.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var inputs = {
      'StandardToken.sol': util.getCode('zeppelin/token/StandardToken.sol'),
      'SimpleToken.sol': info.contract
    }; 
    var output = solc.compile(inputs, 1);
    util.report(output.errors); 
  })

  it('should compile after instrumenting zeppelin-solidity/StandardToken.sol',function(){
    var contract = util.getCode('zeppelin/token/StandardToken.sol');
    var info = getInstrumentedVersion(contract, "test.sol", true);
    var inputs = {
      'ERC20Basic.sol': util.getCode('zeppelin/token/ERC20Basic.sol'),
      'SafeMath.sol': util.getCode('zeppelin/SafeMath.sol'),
      'StandardToken.sol': info.contract
    };
    var output = solc.compile(inputs, 1); 
    util.report(output.errors);
  })
})