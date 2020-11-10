require("@nomiclabs/hardhat-truffle5");
require(__dirname + "/../hardhat");

module.exports={
  logger: process.env.SILENT ? { log: () => {} } : console,
};