pragma solidity ^0.4.4;

contract Owned {
    function Owned() { owner = msg.sender; }
    address owner;
}