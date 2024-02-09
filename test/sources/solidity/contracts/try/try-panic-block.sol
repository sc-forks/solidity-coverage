pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function op(bool y) external returns (uint){
      uint x = 100 / 0;
      return x;
    }

    function a(bool x) external pure returns (uint) {
        try this.op(x) returns (uint v) {
            return v;
        } catch Panic(uint /*errorCode*/) {
            return 0;
        }
    }
}
