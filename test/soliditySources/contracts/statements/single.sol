pragma solidity ^0.5.0;

contract Test {  
    function a(uint x) public {
        keccak256(abi.encodePacked(x));
    }
}