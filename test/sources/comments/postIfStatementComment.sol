pragma solidity ^0.4.13;

contract Test {
  function a(bool x){
    int y;
    if (x){//Comment straight after {
      y = 1;
    }else{//Comment straight after {
      y = 2;
    }
  }
}
