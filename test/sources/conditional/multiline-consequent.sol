pragma solidity ^0.4.3;

contract Test {
    function a() {
        var x = true;
        var y = false;
        (x) 
            ? y = false  
            : y = false;
    }
}