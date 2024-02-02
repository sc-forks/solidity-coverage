// Cost to deploy Expensive:  0x4e042f
// Block gas limit is: 0x47e7c4
// Should throw out of gas on unmodified truffle
// Should pass solcover truffle
pragma solidity >=0.8.0 <0.9.0;

contract Expensive {
    mapping (uint => address) map;
    constructor() public {
        for(uint i = 0; i < 1000; i++ ){
            map[i] = address(this);
        }
    }
}
