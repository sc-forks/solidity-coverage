pragma solidity ^0.5.0;

contract Test {
    event TestEvent();
    function a(uint x) public {
      if(true)
        emit TestEvent();
    }
}