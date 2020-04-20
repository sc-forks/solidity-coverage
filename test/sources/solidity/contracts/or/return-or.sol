pragma solidity ^0.5.0;

contract Test {
    function a(uint x) public pure returns (bool) {
        return (x == 1 && true) || (x == 2 && true);
    }
}
