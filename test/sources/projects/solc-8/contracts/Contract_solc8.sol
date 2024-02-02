pragma solidity >=0.8.0 <0.9.0;
pragma abicoder v2;

import "./Library_solc8.sol";

error InvalidSomeAddress(address someAddress);

using Library_solc8 for uint256;

contract ContractA {
    mapping(bytes32 key => uint256) public authorization;
    address public someAddress;

    function throwError(address _add) external {
        this;

        if (_add == address(0)) {
          revert InvalidSomeAddress(_add);
        }

        someAddress = _add;
    }

    function checkSomething() external {
      uint a = 5;

      unchecked {
        a++;
      }

      unchecked {}
    }
}
