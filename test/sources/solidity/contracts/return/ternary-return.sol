pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function a(uint x) public pure returns (uint) {
        return x > 3 ? x : 1;
    }

    function b(uint x) public pure returns (uint) {
        return (x > 3) ? x : 1;
    }
}
