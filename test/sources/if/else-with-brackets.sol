pragma solidity ^0.4.3;

contract Test {  
    function a(uint x) {
        if (x == 1) {
            throw;
        } else {
            x = 5;
        }
    }
}