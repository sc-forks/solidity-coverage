/* eslint-env node, mocha */

const solc = require('solc');
const getInstrumentedVersion = require('./../lib/instrumentSolidity.js');
const util = require('./util/util.js');
const path = require('path');

/**
 * NB: passing '1' to solc as an option activates the optimiser
 * NB: solc will throw if there is a compilation error, causing the test to fail
 *     and passing the error to mocha.
 */
describe('generic expressions', () => {
  const filePath = path.resolve('./test.sol');

  it('should compile after instrumenting a single binary expression', () => {
    const contract = util.getCode('expressions/single-binary-expression.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const output = JSON.parse(solc.compile(util.codeToCompilerInput(info.contract)));
    util.report(output.errors);
  });

  it('should compile after instrumenting a new expression', () => {
    const contract = util.getCode('expressions/new-expression.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const output = JSON.parse(solc.compile(util.codeToCompilerInput(info.contract)));
    util.report(output.errors);
  });
});
