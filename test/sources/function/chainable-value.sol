pragma solidity ^0.4.3;

// This is for a test that verifies solcover can instrument a 
// another kind of long CallExpression chain
contract Test {
    function paySomeone(address x, address y) payable {
    }

    function a() payable {
        Test(0x00).paySomeone.value(msg.value)(0x00, 0x00);
    }
}