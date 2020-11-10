require("@nomiclabs/hardhat-truffle5");
require(__dirname + "/../hardhat");

module.exports={
  networks: {
    hardhat: {
      gasPrice: 2
    }
  },
  solidity: {
    version: "0.5.15"
  },
  logger: process.env.SILENT ? { log: () => {} } : console,
};
