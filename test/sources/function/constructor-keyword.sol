pragma solidity ^0.5.0;

contract UsesConstructor {
    uint z;
    constructor() public {
      z = 5;
    }
}
contract Test {
    function a() public {
        new UsesConstructor();
    }
}
