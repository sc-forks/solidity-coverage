/* eslint-env node, mocha */
/* global artifacts, contract, assert */

const Simple = artifacts.require('./Simple.sol');

// This test is constructed correctly but the SimpleError.sol has a syntax error
contract('SimpleError', () => {
  it('should set x to 5', () => {
    let simple;
    return Simple.deployed().then(instance => {
      simple = instance;
      return simple.test(5);
    })
    .then(() => simple.getX.call())
    .then(val => assert.equal(val, 5));
  });
});
