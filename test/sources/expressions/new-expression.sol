pragma solidity ^0.4.3;

contract Test {
    function a(uint x) {
      new Test2(x);
    }
}
contract Test2 {
    function Test2(uint x) {
      x+1;
    }
}
