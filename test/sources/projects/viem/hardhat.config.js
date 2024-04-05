require(__dirname + "/../plugins/nomiclabs.plugin");
require("@nomicfoundation/hardhat-viem");

module.exports = {
  networks: {
    hardhat: {
      gasPrice: 50_000_000_000
    }
  },
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true
      },
      viaIR: process.env.VIA_IR === "true"
    }
  },
  logger: process.env.SILENT ? { log: () => {} } : console,
};
