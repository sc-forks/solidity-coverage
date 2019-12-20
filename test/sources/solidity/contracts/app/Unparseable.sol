pragma solidity ^0.5.3;

contract Unparseable {
    uint x = 0;

    function test(uint val) public {
        x = x + val;
    }

    function getX() public view returns (uint){
        return x;

    // Missing a bracket!
}
