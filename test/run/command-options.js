/* eslint-env node, mocha */

const assert = require('assert');
const fs = require('fs');

// Fake event for Simple.sol
const fakeEvent = {
  address: '7c548f8a5ba3a37774440587743bb50f58c7e91c',
  topics: ['1accf53d733f86cbefdf38d52682bc905cf6715eb3d860be0b5b052e58b0741d'],
  data: '0',
};
// Tests whether or not the testCommand option is invoked by exec.js
// Mocha's default timeout is 2000 - here we fake the creation of
// allFiredEvents at 4000.
describe('Test uses mocha', () => {
  it('should run "mocha --timeout 5000" successfully', done => {
    setTimeout(() => {
      fs.writeFileSync('./../allFiredEvents', fakeEvent);
      done();
    }, 4000);
  });
});