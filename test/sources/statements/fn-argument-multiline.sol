pragma solidity ^0.4.3;

contract Test {  

    function multiline(
        uint a, 
        uint b, 
        uint c, 
        bytes32 d) 
    {
        var x = a;
    }
    
    function Test(){
        multiline(
            1,
            2,
            3,
            sha3('hello')
        );
    }
}