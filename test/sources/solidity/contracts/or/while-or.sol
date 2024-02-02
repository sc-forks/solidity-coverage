// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function a(uint x) public {
        uint counter;
        while( (x == 1 || x == 2) && counter < 2 ){
            counter++;
        }
    }
}
