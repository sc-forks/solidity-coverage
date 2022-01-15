pragma solidity ^0.7.0;


contract ContractA {
  uint x;
  constructor() public {
  }

  function sendFn() public {
    x = 1;
  }

  function sendFn2() public {
    x = 2;
  }
}
