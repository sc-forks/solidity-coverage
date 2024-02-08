require("@nomiclabs/hardhat-truffle5");
require(__dirname + "/../plugins/nomiclabs.plugin");

module.exports={
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
