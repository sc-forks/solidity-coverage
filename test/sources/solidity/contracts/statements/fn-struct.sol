// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Test {
    struct Fn {
      function(bytes32) internal view returns(bool) startConditions;
      function(bytes32) internal view endConditions;
    }
}
