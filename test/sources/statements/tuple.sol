pragma solidity ^0.5.0;

contract Test { 

    function returnTuple() public returns (uint x, uint y) {
        return (10, 20);
    }

    function a() public {
    	uint a;
    	uint b;
        (a, b) = (10, 20);
        (a, b) = returnTuple();
    }
}