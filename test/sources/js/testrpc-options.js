const Simple = artifacts.require('./Simple.sol');

contract('Simple', accounts => {

  it('should load with ~ expected balance', async function(){
    let balance = await web3.eth.getBalance(accounts[0]);
    balance = web3.utils.fromWei(balance);
    assert(parseInt(balance) >= 776)
  });

  // Generate some coverage so the script doesn't exit(1) because there are no events
  it('should set x to 5', () => {
    let simple;
    return Simple.deployed().then(instance => {
      simple = instance;
      return simple.test(5);
    })
    .then(() => simple.getX.call())
    .then(val => assert.equal(val.toNumber(), 5));
  });
});
