pragma solidity ^0.5.0;

contract Test {
    function a() {
        var x = false;
        var y = false;
        var z = false;
        z = (x) ? false : true;
    }
}