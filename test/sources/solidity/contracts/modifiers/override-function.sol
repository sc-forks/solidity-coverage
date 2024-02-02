pragma solidity >=0.8.0 <0.9.0;

abstract contract IM {
  function a() payable virtual public;
}

contract Test is IM {
    modifier m {
      require(true);
      _;
    }

    function a() payable m public override {
      uint x = 5;
    }
}
