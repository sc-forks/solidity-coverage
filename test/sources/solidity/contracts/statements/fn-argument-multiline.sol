pragma solidity >=0.8.0 <0.9.0;

contract Test {

    function multiline(
        uint a,
        uint b,
        uint c,
        bytes32 d) public
    {
        uint x = a;
    }

    constructor() public {
        multiline(
            1,
            2,
            3,
            keccak256(abi.encodePacked('hello'))
        );
    }
}
