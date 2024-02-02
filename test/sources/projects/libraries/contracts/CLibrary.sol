// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

library CLibrary {
    uint constant x = 1;
    function a() public view returns (uint) {
        return x;
    }
}