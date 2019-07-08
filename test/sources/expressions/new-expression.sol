pragma solidity ^0.5.0;

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
