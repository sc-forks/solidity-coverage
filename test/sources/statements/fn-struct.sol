pragma experimental "v0.5.0";

contract Test {
    struct Fn {
      function(bytes32) internal constant returns(bool) startConditions;
      function(bytes32) internal constant endConditions;
    }
}