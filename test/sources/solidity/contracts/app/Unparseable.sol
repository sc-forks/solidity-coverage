pragma solidity >=0.8.0 <0.9.0;

contract Unparseable {
    uint x = 0;

    function test(uint val) public {
        x = x + val;
    }

    function getX() public view returns (uint){
        return x;

    // Missing a bracket!
}
