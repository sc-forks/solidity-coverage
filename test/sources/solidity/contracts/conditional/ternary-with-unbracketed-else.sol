pragma solidity ^0.7.0;

contract Test {
    function a() public {
        int i = 0;
        if (false) {} else i == 0 ? i = 0 : i--;
    }
}
