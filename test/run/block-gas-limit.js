
const Expensive = artifacts.require('./Expensive.sol');

contract('Expensive', accounts => {
  it('should deploy', () => Expensive.deployed());
});
