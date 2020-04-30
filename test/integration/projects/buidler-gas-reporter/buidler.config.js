const { loadPluginFile } = require("@nomiclabs/buidler/plugins-testing");
loadPluginFile(__dirname + "/../plugins/buidler.plugin");
usePlugin("@nomiclabs/buidler-truffle5");
usePlugin("buidler-gas-reporter");

module.exports={
  defaultNetwork: "buidlerevm",
};
