// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Old {
  uint public y;

  function a() public {
    bool x = true;
  }

  function b() external {
    bool x = true;
  }

  function c() external {
    bool x = true;
  }
}

contract New {
  uint public y;

  function a() public {
    bool x = true;
  }

  function b() external {
    bool x = true;
  }

  function c() external {
    bool x = true;
  }

  function d() external {
    bool x = true;
  }
}

