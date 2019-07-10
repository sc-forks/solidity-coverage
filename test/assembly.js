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

  it('should compile after instrumenting an assembly function with spaces in parameters', () => {
    const contract = util.getCode('assembly/spaces-in-function.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const output = JSON.parse(solc.compile(util.codeToCompilerInput(info.contract)));
    util.report(output.errors);
  });

});
