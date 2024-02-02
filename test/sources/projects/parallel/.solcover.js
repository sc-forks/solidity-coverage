module.exports = {
  "silent": false,
  "istanbulReporter": [ "json-summary", "text"],
  "mocha": {
    parallel: true // manually tested that setting to false overrides HH config
  },
}
