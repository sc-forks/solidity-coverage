const plugin = require("./plugins/hardhat.plugin");
const PluginUI = require('./plugins/resources/nomiclabs.ui');

// UI for the task flags...
const ui = new PluginUI();

task("coverage", "Generates a code coverage report for tests")
  .addOptionalParam("testfiles",  ui.flags.file,       "", types.string)
  .addOptionalParam("solcoverjs", ui.flags.solcoverjs, "", types.string)
  .addOptionalParam('temp',       ui.flags.temp,       "", types.string)
  .setAction(async function(args, env){
    await plugin(args, env)
  });
