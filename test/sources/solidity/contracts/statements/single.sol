pragma solidity ^0.7.0;

contract Test {
    function a(uint x) public {
        keccak256(abi.encodePacked(x));
    }
}
