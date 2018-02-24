pragma experimental "v0.5.0";
//pragma solidity ^0.4.17;

import "./../assets/PureView.sol";
import "./../assets/CLibrary.sol";

contract TotallyPure is PureView {
  uint onehundred = 99;

  function usesThem() {
    uint y = isPure(1,2);
    uint z = isView();
  }

  function isPure(uint a, uint b) public pure returns (uint){
    return a * b;
  }

  function isView() public view returns (uint){
    return notpureview;
  }

  function isConstant() public constant returns (uint){
    return onehundred;
  }

  function beConstant() public constant returns (uint){
    return onehundred;
  }

  function bePure(uint a, uint b) public pure returns (uint) {
    return a + b;
  }

  function beView() public view returns (uint){
    return onehundred;
  }

  function usesLibrary() public constant returns (uint){
    return CLibrary.a();
  }

  function multiline(uint x,
                     uint y)
                     public
                     view
                     returns (uint)
  {
    return onehundred;
  }

}