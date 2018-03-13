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
    const value = await instance.isPure(4, 5);
    assert.equal(value.toNumber(), 20);
  });

  it('calls an imported, inherited view function', async () => {
    const instance = await TotallyPure.deployed();
    const value = await instance.isView();
    assert.equal(value.toNumber(), 5);
  });

  it('calls an imported, inherited constant function', async () => {
    const instance = await TotallyPure.deployed();
    const value = await instance.isConstant();
    assert.equal(value.toNumber(), 99);
  });

  it('overrides an imported, inherited abstract pure function', async () => {
    const instance = await TotallyPure.deployed();
    const value = await instance.bePure(4, 5);
    assert.equal(value.toNumber(), 9);
  });

  it('overrides an imported, inherited abstract view function', async () => {
    const instance = await TotallyPure.deployed();
    const value = await instance.beView();
    assert.equal(value.toNumber(), 99);
  });

  it('overrides an imported, inherited abstract constant function', async () => {
    const instance = await TotallyPure.deployed();
    const value = await instance.beConstant();
    assert.equal(value.toNumber(), 99);
  });

  it('overrides an imported, inherited abstract constant function, and uses .call()', async () => {
    const instance = await TotallyPure.deployed();
    const value = await instance.beConstant.call();
    assert.equal(value.toNumber(), 99);
  });

  it('calls a pure method implemented in an inherited class', async() => {
    const instance = await TotallyPure.deployed();
    const value = await instance.inheritedPure(4, 5);
    assert.equal(value.toNumber(), 9);
  });

  it('calls a view method implemented in an inherited class', async () => {
    const instance = await TotallyPure.deployed();
    const value = await instance.inheritedView();
    assert.equal(value.toNumber(), 5);
  });

  it('calls a constant method implemented in an inherited class', async () => {
    const instance = await TotallyPure.deployed();
    const value = await instance.inheritedConstant();
    assert.equal(value.toNumber(), 5);
  });

  it('calls a view method whose modifiers span lines', async () => {
    const instance = await TotallyPure.deployed();
    const value = await instance.multiline(5, 7)
    assert.equal(value.toNumber(), 99);
  });

  it('calls a method who signature is defined by an interface', async () => {
    const instance = await TotallyPure.deployed();
    await instance.cry();
  });

});