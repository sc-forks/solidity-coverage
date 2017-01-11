#SolCover

![CircleCI Status](https://circleci.com/gh/JoinColony/solcover.svg?style=shield&circle-token=53d5360d290ef593c7bdce505b86ae8b9414e684)
[![codecov](https://codecov.io/gh/JoinColony/solcover/branch/master/graph/badge.svg)](https://codecov.io/gh/JoinColony/solcover)


###Code coverage for Solidity testing
![coverage example](https://cdn-images-1.medium.com/max/800/1*uum8t-31bUaa6dTRVVhj6w.png)

For more details about what this is, how it work and potential limitations, see 
[the accompanying article](https://blog.colony.io/code-coverage-for-solidity-eecfa88668c2).

###Installation and preparation

From your truffle directory, clone this repo:
```
git clone http://github.com/JoinColony/solcover.git
cd solcover
npm install
```

Until [Truffle allows the `--network` flag for the `test` command](https://github.com/ConsenSys/truffle/issues/239), in `truffle.js` you have to set a large gas amount for deployment. While this is set, uninstrumented tests likely won't run correctly, so this should only be set when running the coverage tests. An appropriately modified `truffle.js` might look like

```
module.exports = {
  rpc: {
    host: 'localhost',
    gasPrice: 20e9,
    gas: 0xfffffff,
  }
 };
```
In the future, hopefully just adding the 'coverage' network to `truffle.js` will be enough. This will look like

```
module.exports = {
  rpc: {
    host: 'localhost',
    gasPrice: 20e9,
  },
  networks:{
    "coverage":{
    	gas: 0xfffffff,
    }
  }
}
```
and will not interfere with normal `truffle test` - or other commands - being run during development.

Note that if you have hardcoded gas costs into your tests, some of them may fail when using SolCover. This is because the instrumentation process increases the gas costs for using the contracts, due to the extra events. If this is the case, then the coverage may be incomplete. To avoid this, using `estimateGas` to estimate your gas costs should be more resilient in most cases.

###Execution

Firstly, make sure that your contracts in your truffle directory are saved elsewhere too - this script moves them and modifies them to do the instrumentation and allow `truffle` to run the tests with the instrumented contracts. It returns them after the tests are complete, but if something goes wrong, then `originalContracts` in the truffle directory should contain the unmodified contracts.

SolCover runs its own (modified) `testrpc` to get the coverage data, so make sure that you've not left a previous instance running on port 8545, otherwise the coverage reported will be.... sparse...

From inside the SolCover directory, run 

```node ./runCoveredTests.js```

Upon completion of the tests, open the `./coverage/lcov-report/index.html` file to browse the HTML coverage report.

###A few, uh, provisos, a, a couple of quid pro quos...
It is very likely that there are valid Solidity statements that this tool won't instrument correctly, as it's only been developed against a small number of contracts. If (and when) you find such cases, please raise an issue.


###TODO

- [ ] **TESTS**
- [ ] Turn into a true command line tool, rather than just a hacked-together script
- [ ] Release on NPM 
- [ ] Do not modify the `../contract/` directory at all during operation (might need changes to truffle)
- [ ] Support for arbitrary testing commands
- [ ] [You tell me](http://github.com/JoinColony/solcover/issues)
