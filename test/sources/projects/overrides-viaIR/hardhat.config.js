require("@nomiclabs/hardhat-truffle5");
require(__dirname + "/../plugins/nomiclabs.plugin");

module.exports={
  solidity: {
    compilers: [
      {
        version: "0.8.17",
      },
      {
        version: "0.8.19"
      },
    ],
    overrides: {
      "contracts/ContractA.sol": {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
            evmVersion: 'paris'
          },
          viaIR: process.env.VIA_IR === "true",
        }
      }
    }
  },
  logger: process.env.SILENT ? { log: () => {} } : console,
};
