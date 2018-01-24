/* eslint-env node, mocha */

const path = require('path');
const getInstrumentedVersion = require('./../lib/instrumentSolidity.js');
const util = require('./util/util.js');
const solc = require('solc');
const assert = require('assert');

describe('comments', () => {
  const filePath = path.resolve('./test.sol');
  const pathPrefix = './';

  it('should cover functions even if comments are present immediately after the opening {', () => {
    const contract = util.getCode('comments/postFunctionDeclarationComment.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });
  it('should cover lines even if comments are present', () => {
    const contract = util.getCode('comments/postLineComment.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const output = solc.compile(info.contract, 1);
    assert.deepEqual([6, 5], info.runnableLines);
    util.report(output.errors);
  });
  it('should cover contracts even if comments are present', () => {
    const contract = util.getCode('comments/postContractComment.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });
  it('should cover if statements even if comments are present immediately after opening { ', () => {
    const contract = util.getCode('comments/postIfStatementComment.sol');
    const info = getInstrumentedVersion(contract, filePath);
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });
});
