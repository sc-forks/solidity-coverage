pragma solidity ^0.7.0;

contract Test {
    function a() public {
        int min = 1;
        int max = 2;
        int value = 3;
        value < min ? min : value > max ? max : value;
    }
}
