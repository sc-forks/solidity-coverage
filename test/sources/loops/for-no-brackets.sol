pragma solidity ^0.4.3;

contract Test {
    function a() {
        for(var x = 0; x < 10; x++)
            sha3(x);
    }
}