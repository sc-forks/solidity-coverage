pragma solidity >=0.4.25 <0.6.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Simple.sol";

contract TestSimple {

  function test_x_is_0() public {
    Simple simple = Simple(DeployedAddresses.Simple());

    uint expected = 0;

    Assert.equal(simple.x, expected, "x should equal 0");
  }
}