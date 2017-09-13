/* eslint-env node, mocha */
/* global artifacts, contract, assert, web3 */

const Wallet = artifacts.require('./Wallet.sol');

contract('Wallet', accounts => {
  it('should should allow transfers and sends', async () => {
    const walletA = await Wallet.new();
    const walletB = await Wallet.new();

    await walletA.sendTransaction({
      value: web3.toBigNumber(100), from: accounts[0],
    });
    await walletA.sendPayment(50, walletB.address, {
      from: accounts[0],
    });
    await walletA.transferPayment(50, walletB.address, {
      from: accounts[0],
    });
    const balance = await walletB.getBalance();
    assert.equal(balance.toNumber(), 100);
  });
});