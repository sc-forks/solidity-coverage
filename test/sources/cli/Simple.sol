pragma solidity ^0.4.3;

contract Simple {
    uint x = 0;
    
    function test(uint val) {
        x = x + val; 
    }

    function getX() returns (uint){
        return x;
    }
}