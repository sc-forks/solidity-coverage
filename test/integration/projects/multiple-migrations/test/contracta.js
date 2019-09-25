const ContractA = artifacts.require("ContractA");

contract("contracta", function(accounts) {
  let instance;

  before(async () => instance = await ContractA.deployed())

  it('sends [ @skipForCoverage ]', async function(){
    await instance.sendFn();
  });

  it('calls [ @skipForCoverage ]', async function(){
    await instance.callFn();
  })
});
