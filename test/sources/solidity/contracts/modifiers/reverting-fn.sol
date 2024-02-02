pragma solidity >=0.8.0 <0.9.0;

contract Test {
    bool flag = true;

    modifier m {
      require(flag);
      _;
    }

    function a(bool success) m public {
        require(success);
    }
}
