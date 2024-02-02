// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function a() public {
        for(uint x = 0; x < 10; x++){
            keccak256(abi.encodePacked(x));
        }
    }
}
