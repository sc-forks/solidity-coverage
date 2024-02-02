/**
 * This contract contains a single function that is accessed using method.call
 * With an unpatched testrpc it should not generate any events.
 */
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract OnlyCall {
    function addTwo(uint val) public pure returns (uint){
        val = val + 2;
        return val;
    }
}
