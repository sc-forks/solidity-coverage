// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Test {

    function returnTuple() public returns (uint x, uint y) {
        return (10, 20);
    }

    function a() public {
        (uint _a, uint _b) = (10, 20);
        (_a, _b) = returnTuple();
    }
}
