pragma solidity >=0.8.0 <0.9.0;

contract Test {
    bool flag = true;

    modifier m {
      require(true);
      _;
    }

    modifier n {
      require(flag);
      _;
    }

    function flip() public {
      flag = !flag;
    }

    function a() m n public {
      uint x = 5;
    }
}
