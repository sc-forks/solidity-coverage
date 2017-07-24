pragma solidity ^0.4.13;

contract Test {
  function a(bool a, bool b, bool c){
    require(a &&
            b &&
            c);
  }
}