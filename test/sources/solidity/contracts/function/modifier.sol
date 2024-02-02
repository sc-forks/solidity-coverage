pragma solidity >=0.8.0 <0.9.0;

contract Test {
    modifier b(){
      uint y;
      _;
    }
    function a(uint x) b public {
        x;
    }
}
