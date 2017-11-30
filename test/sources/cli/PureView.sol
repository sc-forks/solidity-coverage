pragma experimental "v0.5.0";
//pragma solidity ^0.4.17;

contract PureView {

  // Make sure we aren't corrupting anything with the replace
  uint notpureview = 5;

  // Abstract functions to inherit from an uninstrumented, imported file.
  function bePure(uint a, uint b) pure returns (uint);
  function beView() view returns (uint);
  function beConstant() constant returns (uint);
}