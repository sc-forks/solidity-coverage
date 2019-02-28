const fs = require('fs');
const path = require('path');

/**
 * Retrieves code at source/<testType>/<test>.sol
 * @param  {String} _path path relative to `./source`
 * @return {String}       contents of a .sol file
 */
module.exports.getCode = function getCode(_path) {
  return fs.readFileSync(path.join(__dirname, `./../sources/${_path}`), 'utf8');
};

module.exports.report = function report(errors) {
  if (errors) {
    errors.forEach(error => {
      if (error.severity === 'error') {
        throw new Error(`Instrumented solidity invalid: ${JSON.stringify(errors)}`);
      }
    });
  }
};

module.exports.codeToCompilerInput = function codeToCompilerInput(code) {
	return JSON.stringify({
    language: 'Solidity',
    sources: {
      'test.sol': {
        content: code
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': [ '*' ]
        }
      }
    }
  });
}
