pragma experimental "v0.5.0";

contract PureView {

  // Make sure we aren't corrupting anything with the replace
  uint notpureview = 5;

  function isPure(uint a, uint b) pure returns (uint){
    return a * b;
  }

  function isView() view returns (uint){
    return notpureview;
  }
}