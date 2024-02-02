// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function a() public {
        int i = 0;
        if (false) {} else i == 0 ? i = 0 : i--;
    }
}
