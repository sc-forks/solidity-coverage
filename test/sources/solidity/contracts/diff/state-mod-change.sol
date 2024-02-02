// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Old {
  function a() public {
    bool x = true;
  }
}

contract New {
  function a() public view returns (bool) {
    return true;
  }
}
