pragma solidity >=0.8.0 <0.9.0;

function functionB(bool x) returns (bool) {
  bool a = false;
  if (a || x) return x;
}
