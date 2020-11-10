require("@nomiclabs/hardhat-truffle5");
require(__dirname + "/../hardhat");

module.exports = {
  solidity: {
    version: "0.6.7"
  },
  logger: process.env.SILENT ? { log: () => {} } : console,
};
