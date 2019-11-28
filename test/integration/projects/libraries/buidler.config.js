const { loadPluginFile } = require("@nomiclabs/buidler/plugins-testing");
loadPluginFile(__dirname + "/../plugins/buidler.plugin");
usePlugin("@nomiclabs/buidler-truffle5");

module.exports={
  logger: process.env.SILENT ? { log: () => {} } : console,
};