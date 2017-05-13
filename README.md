# solidity-coverage

[![CircleCI](https://circleci.com/gh/sc-forks/solidity-coverage.svg?style=svg)](https://circleci.com/gh/sc-forks/solidity-coverage)
[![codecov](https://codecov.io/gh/sc-forks/solidity-coverage/branch/master/graph/badge.svg)](https://codecov.io/gh/sc-forks/solidity-coverage)

### Code coverage for Solidity testing
![coverage example](https://cdn-images-1.medium.com/max/800/1*uum8t-31bUaa6dTRVVhj6w.png)

For more details about what this is, how it works and potential limitations, see 
[the accompanying article](https://blog.colony.io/code-coverage-for-solidity-eecfa88668c2).

(solidity-coverage is a stand-alone fork of [Solcover](https://github.com/JoinColony/solcover))

### Install
```
$ npm install --save-dev https://github.com/sc-forks/solidity-coverage.git
```

### Run 
```
$ ./node_modules/.bin/solidity-coverage
```

Tests run signficantly slower while coverage is being generated. A 1 to 2 minute delay 
between the end of Truffle compilation and the beginning of test execution is possible if your
test suite is large. Large solidity files can also take a while to instrument.

### Configuration

By default, solidity-coverage generates a stub `truffle.js` that accomodates its special gas needs and 
connects to a modified version of testrpc on port 8555. If your tests will run on the development network
using a standard `truffle.js` and a testrpc instance with no special options, you shouldn't have to 
do any configuration. If your tests depend on logic added to `truffle.js` - for example: 
[zeppelin-solidity](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/truffle.js) 
uses the file to expose a babel polyfill that its suite requires - you can override the 
default behavior by declaring a coverage network in `truffle.js`. solidity-coverage will use your 'truffle.js'
instead of a dynamically generated one. 

**Example coverage network config**
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

You can also create a `.solcover.js` config file in the root directory of your project and specify 
some additional options:
+ **port**: {Number} The port you want solidity-coverage to run testrpc on / have truffle connect to.
+ **testrpcOptions**: {String} A string of options to be appended to a command line invocation 
of testrpc. 
  + Example: `--account="0x89a...b1f',10000" --port 8777`". 
  + Note: you should specify the port in your `testrpcOptions` string AND as a `port` option.
+ **testCommand**: {String} By default solidity-coverage runs `truffle test` or `truffle test --network coverage`. 
This option lets you run tests some other way: ex: `mocha --timeout 5000`. You 
will probably also need to make sure the web3 provider for your tests explicitly connects to the port solidity-coverage's 
testrpc is set to run on, e.g: 
  + `var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8555"))`
+ **norpc**: {Boolean} When true, solidity-coverage will not launch its own testrpc instance. This
can be useful if you are running tests using a different vm like the 
[`sc-forks` version of `pyethereum`](https://github.com/sc-forks/pyethereum). (Default: false).  
+ **dir**: {String} : By default, solidity-coverage looks for a `contracts` folder in your root
directory. `dir` allows you to define a relative path from the root directory to the contracts
folder. A `dir` of `./secretDirectory` would tell solidity-coverage to look for `./secretDirectory/contracts`



**Example .solcover.js config file**
```javascript
module.exports = {
    port: 6545,
    testrpcOptions: '-p 6545 -u 0x54fd80d6ae7584d8e9a19fe1df43f04e5282cc43',
    testCommand: 'mocha --timeout 5000',
    norpc: true
    dir: './secretDirectory'
};
```

### Known Issues

**Hardcoded gas costs**: If you have hardcoded gas costs into your tests some of them may fail when using solidity-coverage. 
This is because the instrumentation process increases the gas costs for using the contracts, due to 
the extra events. If this is the case, then the coverage may be incomplete. To avoid this, using 
`estimateGas` to estimate your gas costs should be more resilient in most cases.

**Events testing**: Because solidity-coverage injects events into your contracts to log which lines your tests reach,
any tests that ask how many events are fired or where the event sits in the logs array
will probably error while coverage is being generated.

**Using `require` in `migrations.js` files**: Truffle overloads Node's `require` function but
implements a simplified search algorithm for node_modules packages 
([see issue #383 at Truffle](https://github.com/trufflesuite/truffle/issues/383)). 
Because solidity-coverage copies an instrumented version of your project into a temporary folder, `require` 
statements handled by Truffle internally won't resolve correctly.  

**Coveralls / CodeCov**: These CI services take the Istanbul reports generated by solidity-coverage and display 
line coverage. Istanbul's own html report publishes significantly more detail and can show whether 
your tests actually reach all the conditional branches in your code. It can be found inside the 
`coverage` folder at `index.html` after you run the tool. 

### Examples

**WARNING**: This utility is in development and its accuracy is unknown. If you 
find discrepancies between the coverage report and your suite's behavior, please open an 
[issue](https://github.com/sc-forks/solidity-coverage/issues). 

+ **metacoin**: The default truffle project
  + [HTML reports](https://sc-forks.github.io/metacoin/)
  + [Metacoin with solidity-coverage installed](https://github.com/sc-forks/metacoin) (simple, without configuration)
+ **zeppelin-solidity** at commit 453a19825013a586751b87c67bebd551a252fb50
  + [HTML reports]( https://sc-forks.github.io/zeppelin-solidity/)
  + [Zeppelin with solidity-coverage installed](https://github.com/sc-forks/zeppelin-solidity) (declares own coverage network in truffle.js)
+ **numeraire** at commit 5ac3fa432c6b4192468c95a66e52ca086c804c95
  + [HTML reports](https://sc-forks.github.io/contract/)
  + [Numeraire with solidity-coverage installed](https://github.com/sc-forks/contract) (uses .solcover.js)

### Contribution Guidelines

Contributions are welcome! If you're opening a PR that adds features please consider writing some
[unit tests](https://github.com/sc-forks/solidity-coverage/tree/master/test) for them. You could 
also lint your submission by running 'npm run lint'. Bugs can be reported in the 
[issues](https://github.com/sc-forks/solidity-coverage/issues)  

### Contributors
+ [@area](https://github.com/area)
+ [@cgewecke](https://github.com/cgewecke)
+ [@adriamb](https://github.com/adriamb)

### TODO

- [ ] Release on NPM 
