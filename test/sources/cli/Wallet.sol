pragma solidity ^0.4.4;

contract Wallet {

    event Deposit(address indexed _sender, uint _value);

    function transferPayment(uint payment, address recipient){
        recipient.transfer(payment);
    }

    function sendPayment(uint payment, address recipient){
        if (!recipient.send(payment))
            revert();
    }

    function getBalance() constant returns(uint){
        return address(this).balance;
    }
    
    function() payable
    {
        if (msg.value > 0)
            Deposit(msg.sender, msg.value);
    }
}