pragma solidity 0.4.21;


contract ContractD {
  uint x;

  function sendFn() public {
    x = 5;
  }

  function callFn() public pure returns (uint){
    uint y = 5;
    return y;
  }
}
