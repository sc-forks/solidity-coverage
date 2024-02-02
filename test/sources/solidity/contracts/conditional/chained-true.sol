// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function a() public {
        int min = 1;
        int max = 2;
        int value = 3;
        value < min
          ? value > max
            ? max
            : value
          : min;
    }
}
