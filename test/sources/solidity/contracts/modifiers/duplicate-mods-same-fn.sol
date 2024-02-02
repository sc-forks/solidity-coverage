// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Test {
    modifier m(string memory val) {
      _;
    }

    function a()
      m('ETH')
      m('BTC')
      public
    {
      uint x = 5;
    }
}
