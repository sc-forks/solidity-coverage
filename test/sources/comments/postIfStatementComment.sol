pragma solidity ^0.5.0;

contract Test {
  function a(bool x) public {
    int y;
    if (x){//Comment straight after {
      y = 1;
    }else{//Comment straight after {
      y = 2;
    }
  }
}
