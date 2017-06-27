pragma solidity ^0.4.3;

contract Test { 

    function returnTuple() returns (uint x, uint y) {
        return (10, 20);
    }

    function a() {
        var (a, b) = (10, 20);
        var (x, y) = returnTuple();
    }
}