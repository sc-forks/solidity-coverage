/* eslint-env node, mocha */
/* global artifacts, contract, assert */

const Simple = artifacts.require('./Simple.sol');

contract('Simple', () => {
  it('should set x to 5', () => {
    let simple;
    return Simple.deployed().then(instance => {
      simple = instance;
      return simple.test(5);
    })
    .then(() => simple.getX.call())
    .then(val => assert.equal(val.toNumber(), 5));
  });
});
