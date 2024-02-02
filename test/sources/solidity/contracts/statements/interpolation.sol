// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Interpolated {
    constructor(string memory a) public {
      string memory b = a;
    }
}

contract TestA is Interpolated("abc{defg}"){
    function a(uint x) public {
        uint y = x;
    }
}

contract TestB is Interpolated {
    constructor(uint x) public Interpolated("abc{defg}") {
        uint y = x;
    }
}
