require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-truffle5");
require(__dirname + "/../hardhat");

module.exports = {
  solidity: {
    version: "0.5.15"
  },
  logger: process.env.SILENT ? { log: () => {} } : console,
};
