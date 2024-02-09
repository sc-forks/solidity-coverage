pragma solidity >=0.8.0 <0.9.0;

contract Test {
    function op(uint y) external returns (uint){
      uint a = 100;
      uint b = 0;

      if (y == 0)
        return 0;
      if (y == 1)
        require(false, 'sorry');
      if (y == 2)
        uint x = (a / b);
      if (y == 3)
        revert();
    }

    function a(uint x) external returns (uint) {
        try this.op(x) returns (uint v) {
            return 0;
        } catch Error(string memory /*reason*/) {
            return 1;
        } catch Panic(uint /*errorCode*/) {
            return 2;
        } catch (bytes memory /*lowLevelData*/) {
            return 3;
        }
    }
}
