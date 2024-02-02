// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function a(uint x) public {
      new Test2(x);
    }
}
contract Test2 {
    constructor(uint x) public {
      x+1;
    }
}
