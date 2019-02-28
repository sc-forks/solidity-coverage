pragma solidity ^0.5.0;

contract Test {
    function a() {
        var x = true;
        var y = false;
        (x) ? y = false : y = false;
    }
}