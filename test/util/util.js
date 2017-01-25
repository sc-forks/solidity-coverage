const fs = require('fs');
const path = require('path');

/**
 * Retrieves code at source/<testType>/<test>.sol
 * @param  {String} _path path relative to `./source`
 * @return {String}       contents of a .sol file
 */
module.exports.getCode = function getCode(_path) {
  return fs.readFileSync(path.join(__dirname, './../sources/' + _path), 'utf8');
};

module.exports.report = function report(errors) {
  if (errors) {
    throw new Error('Instrumented solidity invalid: ' + errors);
  }
};
