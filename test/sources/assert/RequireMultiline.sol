pragma solidity ^0.5.0;

contract Test {
  function a(bool a, bool b, bool c) public {
    require(a &&
            b &&
            c);
  }
}