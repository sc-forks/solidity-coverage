/* eslint-env node, mocha */
/* global artifacts, contract, assert */
const usingOraclize = artifacts.require('usingOraclize');

contract('Nothing', () => {
  it('nothing', async () => {
    const ora = await usingOraclize.new();
    await ora.test();
  });
});