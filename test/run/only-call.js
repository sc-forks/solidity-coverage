
const OnlyCall = artifacts.require('./OnlyCall.sol');

contract('OnlyCall', accounts => {
  it('should return 5', () => 
    OnlyCall.deployed()
    .then(instance => instance.getFive.call())
    .then(val => assert.equal(val, 5))
  );
});
