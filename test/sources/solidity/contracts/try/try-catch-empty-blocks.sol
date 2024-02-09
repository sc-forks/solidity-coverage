pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function op(bool y) external {
      require(y);
    }

    function a(bool x) external {
        try this.op(x) { } catch { }
    }
}
