pragma solidity >=0.8.0 <0.9.0;

import "./FunctionA.sol";
import "./FunctionB.sol";

contract UsesFunctions {
  bool a;

  constructor() public {}

  function useLocalFunction(bool x) public {
    a = x;
  }

  function useImportedFunctions(bool x) public {
    a = functionA(x);
    a = functionB(x);
  }
}
