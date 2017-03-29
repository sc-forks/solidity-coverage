
const Simple = artifacts.require('./Simple.sol');

contract('Simple', accounts => {
  it('should set x to 5', () => {
    let simple;
    return Simple.deployed().then(instance => {
      simple = instance;
      return simple.test(5);
    })
    .then(val => simple.getX.call())
    .then(val => assert.equal(val.toNumber(), 5));
  });
});
