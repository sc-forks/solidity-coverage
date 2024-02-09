pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function op(bool y) external returns (uint){
      require(y, "sorry");
      return 1;
    }

    function a(bool x) external returns (uint) {
        try this.op(x) returns (uint v) {
            return v;
        } catch Error(string memory /*reason*/) {
            return 0;
        }
    }
}
