const UsesFunctions = artifacts.require("UsesFunctions");

contract("contracts", function(accounts) {
  let instance;

  before(async () => {
    instance = await UsesFunctions.new();
  });

  it('when false', async function(){
    await instance.useLocalFunction(false);
    await instance.useImportedFunctions(false);
  });
});
