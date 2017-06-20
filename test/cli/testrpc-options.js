/* eslint-env node, mocha */
/* global artifacts, contract, assert */

const Simple = artifacts.require('./Simple.sol');

contract('Simple', accounts => {
  // Crash truffle if the account loaded in the options string isn't found here.
  it('should load with expected account', () => {
    assert(accounts[0] === '0xa4860cedd5143bd63f347cab453bf91425f8404f');
  });

  // Generate some coverage so the script doesn't exit(1) because there are no events
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