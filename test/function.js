/* eslint-env node, mocha */

const solc = require('solc');
const getInstrumentedVersion = require('./../instrumentSolidity.js');
const util = require('./util/util.js');

/**
 * NB: passing '1' to solc as an option activates the optimiser
 * NB: solc will throw if there is a compilation error, causing the test to fail
 *     and passing the error to mocha.
 */
describe('function declarations', () => {
  it('should compile after instrumenting an ordinary function declaration', () => {
    const contract = util.getCode('function/function.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting an abstract function declaration', () => {
    const contract = util.getCode('function/abstract.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting a function declaration with an empty body', () => {
    const contract = util.getCode('function/empty-body.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting lots of declarations in row', () => {
    const contract = util.getCode('function/multiple.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });
});
