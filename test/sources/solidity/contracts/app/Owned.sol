// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Owned {
    constructor() public { owner = msg.sender; }
    address owner;
}
