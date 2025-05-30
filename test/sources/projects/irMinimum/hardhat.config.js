require("@nomiclabs/hardhat-truffle5");
require(__dirname + "/../plugins/nomiclabs.plugin");

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true
      },
      evmVersion: "cancun",
      viaIR: true
    }
  },
  logger: process.env.SILENT ? { log: () => {} } : console,
};
