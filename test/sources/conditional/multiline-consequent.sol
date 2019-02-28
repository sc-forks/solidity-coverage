pragma solidity ^0.5.0;

contract Test {
    function a() public {
        bool x = true;
        bool y = false;
        (x) 
            ? y = false  
            : y = false;
    }
}