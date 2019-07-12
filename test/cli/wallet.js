/* eslint-env node, mocha */
/* global artifacts, contract, assert, web3 */

const Wallet = artifacts.require('./Wallet.sol');

contract('Wallet', accounts => {
  it('should should allow transfers and sends', async () => {
    const walletA = await Wallet.new();
    const walletB = await Wallet.new();

    await walletA.sendTransaction({
      value: web3.utils.toBN(500), from: accounts[0],
    });
    console.log('transaction done')
    await walletA.sendPayment(50, walletB.address, {
      from: accounts[0],
    });
    console.log('transaction done')
    await walletA.transferPayment(50, walletB.address, {
      from: accounts[0],
    });
    console.log('transaction done')
    const balance = await walletB.getBalance();
    assert.equal(balance.toNumber(), 100);
  });
});