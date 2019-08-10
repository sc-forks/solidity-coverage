pragma solidity ^0.5.0;

contract Test {
  function a(bool _a, bool _b, bool _c) public {
    require(_a &&
            _b &&
            _c);
  }
}