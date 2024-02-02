// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


contract ContractB {
  uint x;
  constructor() public {
  }

  function sendFnB() public {
    x = 5;
  }

  function callFnB() public pure returns (uint){
    uint y = 5;
    return y;
  }
}
