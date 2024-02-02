// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Modified {
  uint counter;

  modifier m  {
    _;
  }

  // When modifier coverage is on, branch cov should be 50%
  // When off: 100%
  function set(uint i)
    m
    public
    payable
    virtual
  {
    counter = counter + i;
  }
}
