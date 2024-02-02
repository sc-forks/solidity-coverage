pragma solidity >=0.8.0 <0.9.0;

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
