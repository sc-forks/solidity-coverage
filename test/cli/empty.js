/* eslint-env node, mocha */
/* global artifacts, contract */

const Empty = artifacts.require('./Empty.sol');

contract('Empty', () => {
  it('should deploy', () => Empty.deployed());
});
