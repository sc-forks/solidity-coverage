# SolCover

![CircleCI Status](https://circleci.com/gh/JoinColony/solcover.svg?style=shield&circle-token=53d5360d290ef593c7bdce505b86ae8b9414e684)
[![codecov](https://codecov.io/gh/JoinColony/solcover/branch/master/graph/badge.svg)](https://codecov.io/gh/JoinColony/solcover)

### Code coverage for Solidity testing
![coverage example](https://cdn-images-1.medium.com/max/800/1*uum8t-31bUaa6dTRVVhj6w.png)

For more details about what this is, how it work and potential limitations, see 
[the accompanying article](https://blog.colony.io/code-coverage-for-solidity-eecfa88668c2).

This branch is an attempt to prepare solcover for npm publication and simplify its use as a
command line utility. Gas cost issues etc are managed under the hood if your tests are able to run 
using the default development network and the tool cleans up after itself if (when) it crashes. 

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
test suite is large.  

Note that if you have hardcoded gas costs into your tests some of them may fail when using SolCover. 
This is because the instrumentation process increases the gas costs for using the contracts, due to 
the extra events. If this is the case, then the coverage may be incomplete. To avoid this, using 
`estimateGas` to estimate your gas costs should be more resilient in most cases.

### TODO

- [ ] Turn into a true command line tool, rather than just a hacked-together script
- [ ] Allow the use of a dedicated coverage network in `truffle.js`
- [ ] Release on NPM 
- [ ] Support for arbitrary testing commands
- [ ] [You tell me](http://github.com/JoinColony/solcover/issues)
