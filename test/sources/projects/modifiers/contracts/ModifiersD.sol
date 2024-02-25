pragma solidity >=0.8.0 <0.9.0;

import "./../external/Ownable.sol";

contract ModifiersD is Ownable {
    constructor() Ownable(msg.sender) {}

    function a() public onlyOwner {
    }
}


