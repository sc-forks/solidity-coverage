require("@nomiclabs/hardhat-truffle5");
require(__dirname + "/../plugins/nomiclabs.plugin");

module.exports = {
  solidity: {
    version: "0.8.21"
  },
  logger: process.env.SILENT ? { log: () => {} } : console,
};
