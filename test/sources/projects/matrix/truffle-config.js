module.exports = {
  networks: {},
  mocha: {},
  compilers: {
    solc: {
      version: "0.8.17"
    }
  },
  logger: process.env.SILENT ? { log: () => {} } : console,
}
