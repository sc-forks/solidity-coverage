pragma solidity ^0.4.3;

contract Test {
  struct Vote {
    mapping (address => uint) voted;
  }

  Vote vote;

  function a(){
    var isYay = false;  
    vote.voted[msg.sender] = isYay ? 1 : 2;
  }
}