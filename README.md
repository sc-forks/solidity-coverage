# SolCover

![CircleCI Status](https://circleci.com/gh/JoinColony/solcover.svg?style=shield&circle-token=53d5360d290ef593c7bdce505b86ae8b9414e684)
[![codecov](https://codecov.io/gh/JoinColony/solcover/branch/master/graph/badge.svg)](https://codecov.io/gh/JoinColony/solcover)

### Code coverage for Solidity testing
![coverage example](https://cdn-images-1.medium.com/max/800/1*uum8t-31bUaa6dTRVVhj6w.png)

For more details about what this is, how it work and potential limitations, see 
[the accompanying article](https://blog.colony.io/code-coverage-for-solidity-eecfa88668c2).

This branch is an attempt to prepare solcover for npm publication and simplify its use as a
command line utility. Gas cost issues are managed under the hood and the tool cleans up after 
itself if (when) it crashes. 

### Install
```
$ npm install --save-dev https://github.com/JoinColony/solcover.git#truffle3
```

### Run 
```
$ ./node_modules/solcover/exec.js
```

Tests run signficantly slower while coverage is being generated. A 1 to 2 minute delay 
between the end of Truffle compilation and the beginning of test execution is not impossible if your
test suite is large. Large solidity files can also take a while to instrument.

### Configuration

By default, solcover generates a stub `truffle.js` that accomodates its special gas needs and 
connects to a modified version of testrpc on port 8555. If your tests can run on the development network
using a standard `truffle.js` and a testrpc instance with no special options, you shouldn't have to 
do any configuration. If your tests depend on logic added to `truffle.js` - for example: 
[zeppelin-solidity](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/truffle.js) 
uses the file to expose a babel polyfill that its suite needs to run correctly - you can override the 
default behavior by specifying a coverage network in `truffle.js`. 

Example coverage network config
```javascript
module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    coverage: {
      host: "localhost",
      network_id: "*", 
      port: 8555,         // <-- Use port 8555  
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01      // <-- Use this low gas price
    }
  }
};
```

### Known Issues

**Hardcoded gas costs**: If you have hardcoded gas costs into your tests some of them may fail when using SolCover. 
This is because the instrumentation process increases the gas costs for using the contracts, due to 
the extra events. If this is the case, then the coverage may be incomplete. To avoid this, using 
`estimateGas` to estimate your gas costs should be more resilient in most cases.

**Events testing**: Solcover injects events into your solidity files to log which lines your tests reach,
so any tests that depend on how many events are fired or where the event sits in the logs array
will probably error while coverage is being generated.

**Using `require` in `migrations.js` files**: Truffle overloads Node's `require` function but
implements a simplified search algorithm for node_modules packages 
([see issue #383 at Truffle](https://github.com/trufflesuite/truffle/issues/383)). 
Because Solcover copies an instrumented version of your project into a temporary folder, `require` 
statements handled by Truffle internally don't resolve correctly.  

### Examples

+ **zeppelin-solidity at commit 453a19825013a586751b87c67bebd551a252fb50**
  + [HTML reports]( https://sc-forks.github.io/zeppelin-solidity/)
  + [Zeppelin with Solcover installed](https://github.com/sc-forks/zeppelin-solidity) (declares own coverage network in truffle.js)

### TODO

- [ ] Turn into a true command line tool, rather than just a hacked-together script
- [ ] Release on NPM 
- [ ] Support for arbitrary testing commands
- [ ] [You tell me](http://github.com/JoinColony/solcover/issues)
