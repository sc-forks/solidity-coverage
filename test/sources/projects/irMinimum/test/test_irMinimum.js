const ContractA = artifacts.require("ContractA");

contract("contracta", function(accounts) {
  let a,b;

  before(async () => {
    a = await ContractA.new();
  })

  it('a:stackTooDeep', async function(){
    await a.stackTooDeep(
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15
    );
  })
});
