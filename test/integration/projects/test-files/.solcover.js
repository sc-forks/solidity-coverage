// Testing hooks
const fn = (msg, config) => config.logger.log(msg);

module.exports = {
  silent: process.env.SILENT ? true : false,
  istanbulReporter: ['json-summary', 'text'],
  onServerReady: fn.bind(null, 'running onServerReady'),
  onTestsComplete: fn.bind(null, 'running onTestsComplete'),
  onCompileComplete: fn.bind(null, 'running onCompileComplete'),
  onIstanbulComplete: fn.bind(null, 'running onIstanbulComplete')
}
