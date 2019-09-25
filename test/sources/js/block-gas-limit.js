const Expensive = artifacts.require('./Expensive.sol');

contract('Expensive', () => {
  it('should deploy', async () => {
    const instance = await Expensive.new()
    const hash = instance.transactionHash;
    const receipt = await web3.eth.getTransactionReceipt(hash);
    assert(receipt.gasUsed > 20000000)
  });
});
