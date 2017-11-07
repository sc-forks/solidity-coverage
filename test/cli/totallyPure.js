/* eslint-env node, mocha */
/* global artifacts, contract, assert */

const TotallyPure = artifacts.require('./TotallyPure.sol');

contract('TotallyPure', accounts => {

  it('calls imported,  inherited pure/view functions within its own function', async function(){
    const instance = await TotallyPure.deployed();
    await instance.usesThem();
  });

  it('calls an imported, inherited pure function', async function(){
    const instance = await TotallyPure.deployed();
    const value = await instance.isPure(4,5);
  });

  it('calls an imported, inherited view function', async function(){
    const instance = await TotallyPure.deployed();
    const value = await instance.isView();
  })

  it('calls an imported, inherited constant function', async function(){
    const instance = await TotallyPure.deployed();
    const value = await instance.isConstant();
  })

  it('overrides an imported, inherited abstract pure function', async function(){
    const instance = await TotallyPure.deployed();
    const value = await instance.bePure(4,5);
  })

  it('overrides an imported, inherited abstract view function', async function(){
    const instance = await TotallyPure.deployed();
    const value = await instance.beView();
  });

  it('overrides an imported, inherited abstract constant function', async function(){
    const instance = await TotallyPure.deployed();
    const value = await instance.beConstant();
  });
});