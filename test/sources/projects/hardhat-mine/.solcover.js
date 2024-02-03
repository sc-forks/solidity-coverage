// Testing hooks
const fn = (msg, config) => config.logger.log(msg);

module.exports = {
  silent: process.env.SILENT ? true : false,
  istanbulReporter: ['json-summary', 'text'],
}
