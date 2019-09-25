pragma solidity ^0.5.0;

contract Test {  
    function a(uint x) public {
        keccak256(abi.encodePacked(x));
        keccak256(abi.encodePacked(uint256(0)));
    }
}