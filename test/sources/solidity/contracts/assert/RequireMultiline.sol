pragma solidity >=0.8.0 <0.9.0;

contract Test {
  function a(bool _a, bool _b, bool _c) public {
    require(_a &&
            _b &&
            _c);
  }
}
