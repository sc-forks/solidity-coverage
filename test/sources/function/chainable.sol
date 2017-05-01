pragma solidity ^0.4.3;

// This is for a test that verifies solcover can instrument a 
// chained constructor/method call.
contract Test {
    function chainWith(uint y, uint z) {}
    
    function a(){
        Test(0x00).chainWith(3, 4);  
    }
}
