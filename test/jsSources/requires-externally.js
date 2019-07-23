/* eslint-env node, mocha */
/* global artifacts, contract, assert */

const asset = require('../assets/asset.js');

const Simple = artifacts.require('./Simple.sol');

contract('Simple', () => {
  it('should be able to require an external asset', () => {
    let simple;
    return Simple.deployed().then(instance => {
      simple = instance;
      assert.equal(asset.value, true);
      return simple.test(5); // Make sure we generate an event;
    });
  });
});