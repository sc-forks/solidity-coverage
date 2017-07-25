pragma solidity ^0.4.3;

contract Test {  
    function f1(bytes32 x) {
        x = 1;
    }
    
    function f2(uint x){ x = 2; }

    address a;

    function f3(uint y){
        y = 1;
    }
}