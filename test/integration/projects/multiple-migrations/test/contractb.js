const ContractB = artifacts.require("ContractB");

contract("contractB [ @skipForCoverage ]", function(accounts) {
  let instance;

  before(async () => instance = await ContractB.deployed())

  it('sends', async function(){
    await instance.sendFn();
  });

  it('calls', async function(){
    await instance.callFn();
  })
});
