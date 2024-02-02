pragma solidity >=0.8.0 <0.9.0;

contract Test {
    modifier mmm {
      require(true);
      _;
    }

    modifier nnn {
      require(true);
      _;
    }

    function a() mmm nnn public {
      uint x = 5;
    }
}
