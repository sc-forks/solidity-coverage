pragma solidity ^0.4.3;

// This is for a test that verifies solcover can instrument a 
// chained constructor/method call invoked by the new operator.
contract Chainable {
    function chainWith(uint y, uint z) {}
}
contract Test {
    function a(){
        new Chainable().chainWith(3, 4);   
    }
}