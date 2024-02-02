pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function a(uint x) public {
        if ((x == 1) || (x == 2 || true)) {
            /* ignore */
        } else {
            revert();
        }
    }
}
