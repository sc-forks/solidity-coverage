pragma solidity ^0.7.0;

contract Test {
    event TestEvent();
    function a(uint x) public {
        emit TestEvent();
    }
}
