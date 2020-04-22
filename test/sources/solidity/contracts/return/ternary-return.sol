pragma solidity ^0.5.0;

contract Test {
    function a(uint x) public pure returns (uint) {
        return x > 3 ? x : 1;
    }

    function b(uint x) public pure returns (uint) {
        return (x > 3) ? x : 1;
    }
}
