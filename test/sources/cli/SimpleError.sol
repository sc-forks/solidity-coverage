// This contract should throw a parse error in instrumentSolidity.js
pragma solidity ^0.4.3;

contract SimpleError {
    uint x = 0;
    
    function test(uint val) {
        x = x + val // <-- no semi-colon 
    }

    function getX() returns (uint){
        return x;
    }
}