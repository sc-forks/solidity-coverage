pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function isFalse(uint _a, uint _b) public pure returns (bool){
      return false;
    }

    function a(uint x) public {
        require((
              x == 1 &&
              x == 2 ) ||
          !isFalse(
            x,
            3
          ),
          "unhealthy position"
        );
    }
}
