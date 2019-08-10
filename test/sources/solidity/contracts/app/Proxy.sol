pragma solidity ^0.5.0;

import "./Owned.sol";

contract Proxy is Owned {
    function isOwner() public returns (bool) {
        if (msg.sender == owner) {
            return true;
        } else {
            return false;
        }
    }
}