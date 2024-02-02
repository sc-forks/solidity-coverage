pragma solidity >=0.8.0 <0.9.0;

// This test verifies that an invoked function gets logged as a statement
contract Test {
    function loggedAsStatement(uint x) public {}
    function a() public {
        loggedAsStatement(5);
    }
}
