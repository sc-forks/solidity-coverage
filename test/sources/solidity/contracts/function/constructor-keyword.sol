pragma solidity >=0.8.0 <0.9.0;

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
