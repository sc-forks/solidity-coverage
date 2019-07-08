pragma solidity ^0.5.0;

contract Owned {
    constructor() public { owner = msg.sender; }
    address owner;
}