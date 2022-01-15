const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("contractA", function() {
  let instance;
  let startBlockNumber;

  before(async () => {
    const factory = await ethers.getContractFactory("ContractA");
    instance = await factory.deploy();
    startBlockNumber = await ethers.provider.getBlockNumber();
  });

  it('sends', async function(){
    await instance.sendFn();
  });

  // Reset network and expect sendFn to still be covered
  describe('reset tests', function() {
    beforeEach(async function() {
      await hre.network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            forking: {
              jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_TOKEN}`,
              blockNumber: startBlockNumber,
            },
          },
        ],
      });

      const newBlockNumber = await ethers.provider.getBlockNumber();
    });

    it('sends 2', async function(){
      await instance.sendFn2();
    })
  });
});

