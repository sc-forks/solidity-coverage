// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Test {
    modifier m {
      require(false);
      _;
    }

    function a() m public {
      uint x = 5;
    }
}
