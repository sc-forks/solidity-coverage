pragma solidity ^0.4.3;

// This test verifies that an invoked function gets logged as a statement
contract Test {  
    function loggedAsStatement(uint x) {}
    function a(){
        loggedAsStatement(5);
    }
}