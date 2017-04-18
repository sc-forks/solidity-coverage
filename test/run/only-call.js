
const OnlyCall = artifacts.require('./OnlyCall.sol');

contract('OnlyCall', accounts => {
  it('should return val + 2', function(done){ 
    OnlyCall.deployed().then(function(instance){
        instance.addTwo.call(5, {from: accounts[0]}).then(function(val){        
            assert.equal(val, 7);
            done();
        })
    })
  });
});
