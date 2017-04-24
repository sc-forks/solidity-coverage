/* eslint-env node, mocha */
/* global artifacts, contract, assert */

const Owned = artifacts.require('./Owned.sol');
const Proxy = artifacts.require('./Proxy.sol');

contract('Proxy', accounts => {
  it('Should compile and run when one contract inherits from another', () => Owned.deployed()
        .then(() => Proxy.deployed())
        .then(instance => instance.isOwner.call({
          from: accounts[0],
        }))
        .then(val => assert.equal(val, true)));
});
