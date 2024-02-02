pragma solidity >=0.8.0 <0.9.0;

contract Test {
    event TestEvent();
    function a(uint x) public {
      if(true)
        emit TestEvent();
    }
}
