pragma experimental "v0.5.0";

import "./../assets/PureView.sol";

contract TotallyPure is PureView {
  uint onehundred = 99;

  function usesThem() {
    uint y = isPure(1,2);
    uint z = isView();
  }

  function isPure(uint a, uint b) pure returns (uint){
    return a * b;
  }

  function isView() view returns (uint){
    return notpureview;
  }

  function isConstant() constant returns (uint){
    return onehundred;
  }

  function beConstant() constant returns (uint){
    return onehundred;
  }

  function bePure(uint a, uint b) pure returns (uint) {
    return a + b;
  }

  function beView() view returns (uint){
    return onehundred;
  }
}