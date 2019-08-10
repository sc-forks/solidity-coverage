/* eslint-env node, mocha */
/* global artifacts, contract, assert */

const OnlyCall = artifacts.require('./OnlyCall.sol');

contract('OnlyCall', accounts => {
  it('should return val + 2', done => {
    OnlyCall.deployed().then(instance => {
      instance.addTwo.call(5, {
        from: accounts[0],
      }).then(val => {
        assert.equal(val, 7);
        done();
      });
    });
  });
});
