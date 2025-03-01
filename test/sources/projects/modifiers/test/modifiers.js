const ModifiersA = artifacts.require("ModifiersA");
const ModifiersC = artifacts.require("ModifiersC");
const ModifiersD = artifacts.require("ModifiersD");

contract("Modifiers", function(accounts) {
  let instance;

  before(async () => {
    A = await ModifiersA.new();
    C = await ModifiersC.new();
    D = await ModifiersD.new();
  })

  it('simpleSet (overridden method)', async function(){
    await A.simpleSet(5);
  });

  it('simpleView (overridden modifier)', async function(){
    await A.simpleView(5);
  });

  it('simpleSetFlip (both branches)', async function(){
    await A.simpleSetFlip(5);
    await A.flip();

    try {
      await A.simpleSetFlip(5);
    } catch (e) {
      /* ignore */
    }
  });

  it('simpleSetFlip (false branch + other file)', async function(){
    await C.flip();

    try {
      await C.simpleSetFlip(5);
    } catch (e) {
      /* ignore */
    }
  });

  it('when false & true branches are hit in immediate succession by EOA (issue #863)', async function(){
    try {
      await D.a({from: accounts[1]});
    } catch (e) {
      /* ignore */
    }

    await D.a({from: accounts[0]});
  })
});
