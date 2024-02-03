const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Setter", function() {
  let instance;

  before(async () => {
    const factory = await ethers.getContractFactory("Setter");
    instance = await factory.deploy();
  });

  it('sets at the beginning', async function(){
    await instance.set();
  });

  it('sets at the end', async function(){
    // Mine about 50K blocks
    await hre.network.provider.send('hardhat_mine', ['0xCCCC'])
    await instance.set();
  });
});

