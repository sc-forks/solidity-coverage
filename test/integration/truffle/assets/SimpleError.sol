// This contract should throw a parse error in instrumentSolidity.js
pragma solidity ^0.5.0;

contract SimpleError {
    uint x = 0;

    function test(uint val) public {
        x = x + val // <-- no semi-colon
    }

    function getX() public returns (uint){
        return x;
    }
}
