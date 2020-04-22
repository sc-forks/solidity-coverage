pragma solidity ^0.5.0;

contract Test {
    function a(uint x) public {
        require(x == 1 || x == 2);
    }
}
