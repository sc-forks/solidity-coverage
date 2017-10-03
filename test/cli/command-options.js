/* eslint-env node, mocha */

const assert = require('assert');
const fs = require('fs');

// Fake event for Simple.sol
const fakeEvent = {"address":"6d6cf716c2a7672047e15a255d4c9624db60f215","topics":["34b35f4b1a8c3eb2caa69f05fb5aadc827cedd2d8eb3bb3623b6c4bba3baec17"],"data":"00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000003a2f55736572732f757365722f53697465732f73632d666f726b732f6d657461636f696e2f636f6e7472616374732f4d657461436f696e2e736f6c000000000000"}

/* {
  address: '7c548f8a5ba3a37774440587743bb50f58c7e91c',
  topics: ['1accf53d733f86cbefdf38d52682bc905cf6715eb3d860be0b5b052e58b0741d'],
  data: '0',
};*/
// Tests whether or not the testCommand option is invoked by exec.js
// Mocha's default timeout is 2000 - here we fake the creation of
// allFiredEvents at 4000.
describe('Test uses mocha', () => {
  it('should run "mocha --timeout 5000" successfully', done => {
    setTimeout(() => {
      fs.writeFileSync('./../allFiredEvents', JSON.stringify(fakeEvent) + '\n');
      done();
    }, 4000);
  });
});