pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function a() public {
        bool t = true;
        while(t)
            t = false;
    }
}
