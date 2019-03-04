pragma solidity ^0.5.0;

contract Test {
    modifier b(){
      uint y;
      _;
    }
    function a(uint x) b public {
        x;
    }
}
