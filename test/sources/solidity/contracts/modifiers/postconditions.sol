pragma solidity ^0.7.0;

contract Test {
    bool precondition = true;
    bool postcondition = true;

    modifier m {
      require(precondition);
      _;
      require(postcondition);
    }

    function flip_precondition() public {
      precondition = !precondition;
    }

    function flip_postcondition() public {
      postcondition = !postcondition;
    }

    function a() m public {
      uint x = 5;
    }
}
