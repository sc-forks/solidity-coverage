pragma solidity ^0.4.3;

contract Events {
    uint x = 0;
    event LogEventOne( uint x, address y);
    event LogEventTwo( uint x, address y);

    function test(uint val) {
        LogEventOne(100, msg.sender);
        x = x + val; 
        LogEventTwo(200, msg.sender);
    }

    function getX() returns (uint){
        return x;
    }
}