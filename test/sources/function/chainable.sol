pragma solidity ^0.4.3;

// This is for a test that verifies solcover can instrument a 
// chained constructor/method call.
contract Chainable {
    function chainWith(uint y, uint z){}
}

contract Test {
    function Test(){
        Chainable(0x00).chainWith(3, 4);
        new Chainable().chainWith(3, 4);
    }
}
