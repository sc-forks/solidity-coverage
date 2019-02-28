pragma solidity ^0.5.0;

contract Test {
  struct Vote {
    mapping (address => uint) voted;
  }

  Vote vote;

  function a() public {
    var isYay = false;  
    vote.voted[msg.sender] = isYay ? 1 : 2;
  }
}