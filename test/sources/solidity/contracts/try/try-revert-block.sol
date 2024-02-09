pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function op(bool y) external returns (uint){
      if (y == false) revert();
    }

    function a(bool x) external pure returns (uint) {
        try this.op(x) returns (uint v) {
            return v;
        } catch (bytes memory /*lowLevelData*/) {
            return 0;
        }
    }
}
