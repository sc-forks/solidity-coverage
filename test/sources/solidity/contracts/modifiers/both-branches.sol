// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Test {
    bool flag = true;

    modifier m {
      require(flag);
      _;
    }

    function flip() public {
      flag = !flag;
    }

    function a() m public {
      uint x = 5;
    }
}
