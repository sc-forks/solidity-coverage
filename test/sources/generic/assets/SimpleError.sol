// This contract should throw a parse error in instrumentSolidity.js
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract SimpleError {
    uint x = 0;

    function test(uint val) public {
        x = x + val // <-- no semi-colon
    }

    function getX() public returns (uint){
        return x;
    }
}
