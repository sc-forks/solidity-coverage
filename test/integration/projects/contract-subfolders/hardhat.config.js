require("@nomiclabs/hardhat-truffle5");
require(__dirname + "/../plugins/nomiclabs.plugin");

module.exports={
  networks: {
    hardhat: {
      gasPrice: 2
    }
  },
  solidity: {
    version: "0.5.15"
  },
  paths: {
    contracts: 'contracts/A'
  },
  logger: process.env.SILENT ? { log: () => {} } : console,
};
