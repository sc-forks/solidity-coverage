pragma solidity ^0.4.3;

contract Events {
    uint x = 0;
    bool a;
    bool b;
    event LogEventOne( uint x, address y);
    event LogEventTwo( uint x, address y);

    function test(uint val) {
        // Assert / Require events
        require(true);
        
        // Contract Events
        LogEventOne(100, msg.sender);
        x = x + val; 
        LogEventTwo(200, msg.sender);
        
        // Branch events
        if (true) {
            a = false;
        } else {
            b = false;
        }
    }

    function getX() returns (uint){
        return x;
    }
}