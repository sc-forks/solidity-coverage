/* eslint-env node, mocha */
/* global artifacts, contract, assert */

const Events = artifacts.require('./Events.sol');

contract('Events', () => {
  it('logs events correctly', done => {
    const loggedEvents = [];
    Events.deployed().then(instance => {
      const allEvents = instance.allEvents();
      allEvents.watch((error, event) => { loggedEvents.push(event); });

      instance.test(5).then(() => {
        if (loggedEvents.length > 2) { 
          assert(false, 'Did not filter events correctly'); 
        } else { 
          assert(true); 
        }

        done();
      });
    });
  });
});