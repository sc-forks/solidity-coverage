pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function a(bytes32 x) public {
        x;
    }

    function b () public {
        a(keccak256(abi.encodePacked(uint256(0))));
    }
}
