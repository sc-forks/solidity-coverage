// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function a(uint x,uint y, uint z) public {
        if (x == y) {
        	z = 0;
        } else if (x == 2) {
            z = 1;
        } else {
        	z = 2;
        }

        if (x == y) {
        	z = 0;
        } else if (x == 2) {
            z = 1;
        } else {
        	z = 2;
        }
    }
}
