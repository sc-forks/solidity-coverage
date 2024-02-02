// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Test {
    modifier mmm {
      require(true);
      _;
    }

    function a() mmm public {
      uint x = 5;
    }

    function b() mmm public {
      uint x = 5;
    }
}
