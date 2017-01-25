/* eslint-env node, mocha */

const solc = require('solc');
const getInstrumentedVersion = require('./../instrumentSolidity.js');
const util = require('./util/util.js');

describe('return statements', () => {
  it('should compile after instrumenting function that returns true', () => {
    const contract = util.getCode('return/return.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting function that returns without specifying val (null)', () => {
    const contract = util.getCode('return/return-null.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });
});
