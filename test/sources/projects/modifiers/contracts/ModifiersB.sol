pragma solidity >=0.8.0 <0.9.0;


contract ModifiersB {
  uint value;
  uint b;

  constructor() public {
  }

  modifier overridden() virtual {
    require(true);
    _;
  }

  function simpleSet(uint i) public virtual {
    value = 5;
  }
}
