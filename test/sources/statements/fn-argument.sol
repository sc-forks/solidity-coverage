pragma solidity ^0.4.3;

contract Test {  
    function a(bytes32 x) {
        x;
    }
    
    function b (){
        a(sha3(0));
    }   
}