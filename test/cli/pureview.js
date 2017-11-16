/* eslint-env node, mocha */
/* global artifacts, contract, assert */

const PureView = artifacts.require('./PureView.sol');

contract('PureView', accounts => {
  it('calls a pure function', async () => {
    const instance = await PureView.deployed();
    const value = await instance.isPure(4, 5);
  });

  it('calls a view function', async () => {
    const instance = await PureView.deployed();
    const value = await instance.isView();
  });
});