pragma experimental "v0.5.0";
//pragma solidity ^0.4.17;

contract PureView {

  // Make sure we aren't corrupting anything with the replace
  uint notpureview = 5;

  // Abstract functions to inherit from an uninstrumented, imported file.
  function bePure(uint a, uint b) public pure returns (uint);
  function beView() public view returns (uint);
  function beConstant() public constant returns (uint);

  function inheritedPure(uint a, uint b) public pure returns(uint){
    return a + b;
  }

  function inheritedView() public view returns (uint){
    return notpureview;
  }

  function inheritedConstant() public constant returns (uint){
    return notpureview;
  }
}