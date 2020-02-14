pragma solidity ^0.5.0;

contract Interpolated {
    constructor(string memory a) public {
      string memory b = a;
    }
}

contract Test is Interpolated("abc{defg}"){
    function a(uint x) public {
        uint y = x;
    }
}
