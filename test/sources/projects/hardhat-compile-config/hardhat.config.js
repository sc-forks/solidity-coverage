require("@nomiclabs/hardhat-truffle5");
require(__dirname + "/../plugins/nomiclabs.plugin");

module.exports={
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true
          },
          viaIR: process.env.VIA_IR === "true"
        }
      },
      {
        version: "0.8.19"
      },
      // Make sure optimizer gets disabled
      {
        version: "0.8.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
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
