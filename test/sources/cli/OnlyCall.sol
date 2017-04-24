/**
 * This contract contains a single function that is accessed using method.call
 * With an unpatched testrpc it should not generate any events. 
 */
pragma solidity ^0.4.3;

contract OnlyCall {
    function addTwo(uint val) returns (uint){
        val = val + 2;
        return val;
    }
}