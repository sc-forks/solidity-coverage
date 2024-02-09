module.exports = {
  silent: process.env.SILENT ? true : false,
  skipFiles: [],
  istanbulReporter: ['json-summary', 'text']
}
