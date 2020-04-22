pragma solidity ^0.5.0;

contract Test {
    function a(uint x) public {
        uint counter;
        while( (x == 1 || x == 2) && counter < 2 ){
            counter++;
        }
    }
}
