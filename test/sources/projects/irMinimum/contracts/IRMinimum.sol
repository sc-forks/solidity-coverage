pragma solidity >=0.8.0 <0.9.0;

contract ContractA {
    // 15 fn args + 1 local variable assignment
    // will trigger stack too deep error when optimizer is off.
    function stackTooDeep(
      uint _a,
      uint _b,
      uint _c,
      uint _d,
      uint _e,
      uint _f,
      uint _g,
      uint _h,
      uint _i,
      uint _j,
      uint _k,
      uint _l,
      uint _m,
      uint _n,
      uint _o
    ) public {
      uint x = _a;
    }
}

