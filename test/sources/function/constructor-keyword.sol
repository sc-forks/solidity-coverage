pragma solidity ^0.4.23;

contract UsesConstructor {
    uint z;
    constructor(){
      z = 5;
    }
}
contract Test {
    function a(){
        new UsesConstructor();
    }
}
