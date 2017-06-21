/* eslint-env node, mocha */
/* global artifacts, contract, assert */

const Events = artifacts.require('./Events.sol');

contract('Events', accounts => {
  it('logs events correctly', done => {
    const loggedEvents = [];
    Events.deployed().then(instance => {
      const allEvents = instance.allEvents();
      allEvents.watch((error, event) => { loggedEvents.push(event); });

      instance.test(5).then(() => {
        const bad = loggedEvents.filter(e => e.event !== 'LogEventOne' && e.event !== 'LogEventTwo');
        assert(bad.length === 0, 'Did not filter events correctly');
        allEvents.stopWatching(done);
      });
    });
  });
});