pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function a() public {
        bool x = true;
        bool y = true;
        x && y ? y = false : y = false;
    }
}
