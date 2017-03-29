
const Empty = artifacts.require('./Empty.sol');

contract('Empty', accounts => {
  it('should deploy', () => Empty.deployed());
});
