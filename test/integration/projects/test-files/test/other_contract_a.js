const OtherContractA = artifacts.require("OtherContractA");

contract("otherContractA", function(accounts) {
  let instance;

  before(async () => instance = await OtherContractA.new())

  it('sends', async function(){
    await instance.sendFn();
  });

  it('calls', async function(){
    await instance.callFn();
  })
});
