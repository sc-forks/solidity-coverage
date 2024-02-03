require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require(__dirname + "/../plugins/nomiclabs.plugin");

module.exports = {
  solidity: {
    version: "0.8.17"
  },
  logger: process.env.SILENT ? { log: () => {} } : console,
};
