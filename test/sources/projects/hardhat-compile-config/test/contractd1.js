const ContractD = artifacts.require("ContractD");

contract("contractd", function(accounts) {
  let instance;

  before(async () => instance = await ContractD.new())

  it('sends', async function(){
    await instance.sendFn();
  });

  it('calls', async function(){
    await instance.callFn();
  })

  it('sends', async function(){
    await instance.sendFn();
  });

});
