require(__dirname + "/../plugins/nomiclabs.plugin");

module.exports = {
  mocha: {
    parallel: true
  },
  logger: process.env.SILENT ? { log: () => {} } : console,
};
