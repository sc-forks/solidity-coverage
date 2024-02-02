// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

contract A {
    uint valA;

    function setA() public {
        valA = 1;
    }
}

contract B is A {
    uint valB;

    function setB() public {
        valB = 1;
    }
}

contract C is A {
    uint valC;

    function setC() public {
        valC = 1;
    }
}

contract D is B, C {
    uint valD;

    function setD() public {
        valD = 1;
    }
}
