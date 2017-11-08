/* eslint-env node, mocha */
/* global artifacts, contract, assert */

const TotallyPure = artifacts.require('./TotallyPure.sol');

contract('TotallyPure', accounts => {
  it('calls imported,  inherited pure/view functions within its own function', async () => {
    const instance = await TotallyPure.deployed();
    await instance.usesThem();
  });

  it('calls an imported, inherited pure function', async () => {
    const instance = await TotallyPure.deployed();
    const value = await instance.isPure.call(4, 5);
    assert.equal(value.toNumber(), 20);
  });

  it('calls an imported, inherited view function', async () => {
    const instance = await TotallyPure.deployed();
    const value = await instance.isView.call();
    assert.equal(value.toNumber(), 5);
  });

  it('calls an imported, inherited constant function', async () => {
    const instance = await TotallyPure.deployed();
    const value = await instance.isConstant.call();
    assert.equal(value.toNumber(), 99);
  });

  it('overrides an imported, inherited abstract pure function', async () => {
    const instance = await TotallyPure.deployed();
    const value = await instance.bePure.call(4, 5);
    assert.equal(value.toNumber(), 9);
  });

  it('overrides an imported, inherited abstract view function', async () => {
    const instance = await TotallyPure.deployed();
    const value = await instance.beView.call();
    assert.equal(value.toNumber(), 99);
  });

  it('overrides an imported, inherited abstract constant function', async () => {
    const instance = await TotallyPure.deployed();
    const value = await instance.beConstant.call();
    assert.equal(value.toNumber(), 99);
  });
});