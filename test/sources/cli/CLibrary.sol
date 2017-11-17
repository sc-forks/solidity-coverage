pragma solidity ^0.4.17;

library CLibrary {
    uint constant x = 1;
    function a() constant returns (uint) {
        return x;
    }
}