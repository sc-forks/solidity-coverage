pragma solidity ^0.4.4;

import "./Owned.sol";

contract Proxy is Owned {
    function isOwner() returns (bool) {
        if (msg.sender == owner) {
            return true;
        } else {
            return false;
        }
    }
}