pragma solidity >=0.8.0 <0.9.0;

contract Test {
  struct Vote {
    mapping (address => uint) voted;
  }

  Vote vote;

  function a() public {
    bool isYay = false;
    vote.voted[msg.sender] = isYay ? 1 : 2;
  }
}
