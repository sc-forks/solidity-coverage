pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function a() public {
        bool x = false;
        bool y = false;
        (x)
            ? y = false
            : y = false;
    }
}
