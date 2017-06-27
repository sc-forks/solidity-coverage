# solidity-coverage
[![npm version](https://badge.fury.io/js/solidity-coverage.svg)](https://badge.fury.io/js/solidity-coverage)
[![CircleCI](https://circleci.com/gh/sc-forks/solidity-coverage.svg?style=svg)](https://circleci.com/gh/sc-forks/solidity-coverage)
[![codecov](https://codecov.io/gh/sc-forks/solidity-coverage/branch/master/graph/badge.svg)](https://codecov.io/gh/sc-forks/solidity-coverage)
[![Stories in Ready](https://badge.waffle.io/sc-forks/solidity-coverage.png?label=ready&title=Ready)](https://waffle.io/sc-forks/solidity-coverage?utm_source=badge)

### Code coverage for Solidity testing
![coverage example](https://cdn-images-1.medium.com/max/800/1*uum8t-31bUaa6dTRVVhj6w.png)

For more details about what this is, how it works and potential limitations, see
[the accompanying article](https://blog.colony.io/code-coverage-for-solidity-eecfa88668c2).

**solidity-coverage** is a stand-alone fork of [Solcover](https://github.com/JoinColony/solcover)

### Install
```
$ npm install --save-dev solidity-coverage
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


+ **port**: *{ Number }* Port to run testrpc on / have truffle connect to. (Default: 8555)
+ **accounts**: *{ Number }* Number of accounts to launch testrpc with. (Default: 35)
+ **testrpcOptions**: *{ String }* options to append to a command line invocation of testrpc.
  + ex: `--secure --port 8555 --unlock "0x1234..." --unlock "0xabcd..."`.
  + NB: you should specify a port in your rpc options string and also declare it in the config's `port` option.
+ **testCommand**: *{ String }* By default solidity-coverage runs `truffle test`. This option lets
you run an arbitrary test command instead, like: `mocha --timeout 5000`.
  + remember to set the config's port option to whatever port your tests use (probably 8545).
  + make sure you don't have another instance of testrpc running on that port (web3 will error if you do).
+ **norpc**: *{ Boolean }* When true, solidity-coverage will not launch its own testrpc instance. This
can be useful if you are using a different vm like the [sc-forks version of pyethereum](https://github.com/sc-forks/pyethereum).  
+ **dir**: *{ String }* : Solidity-coverage usually looks for `contracts` and `test` folders in your root
directory. `dir` allows you to define a relative path from the root directory to those assets.
`dir: "./<dirname>"` would tell solidity-coverage to look for `./<dirname>/contracts/` and `./<dirname>/test/`
+ **copyNodeModules**: *{ Boolean }* : When true, will copy `node_modules` into the coverage environment. False by default, and may significantly increase the time for coverage to complete if enabled. Only enable if required.
+ **skipFiles**: *{ Array }* : An array of contracts (with paths expressed relative to the `contracts` directory) that should be skipped when doing instrumentation. `Migrations.sol` is skipped by default, and does not need to be added to this configuration option if it is used.

**Example .solcover.js config file**
```javascript
module.exports = {
    port: 6545,
    testrpcOptions: '-p 6545 -u 0x54fd80d6ae7584d8e9a19fe1df43f04e5282cc43',
    testCommand: 'mocha --timeout 5000',
    norpc: true,
    dir: './secretDirectory'
};
```

### Known Issues

**Hardcoded gas costs**: If you have hardcoded gas costs into your tests some of them may fail when using solidity-coverage.
This is because the instrumentation process increases the gas costs for using the contracts, due to
the extra events. If this is the case, then the coverage may be incomplete. To avoid this, using
`estimateGas` to estimate your gas costs should be more resilient in most cases.

**Using `require` in `migrations.js` files**: Truffle overloads Node's `require` function but
implements a simplified search algorithm for node_modules packages
([see Truffle issue #383](https://github.com/trufflesuite/truffle/issues/383)).
Because solidity-coverage copies an instrumented version of your project into a temporary folder, `require`
statements handled by Truffle internally won't resolve correctly.  

**Using HDWalletProvider in `truffle.js`**: [See Truffle issue #348](https://github.com/trufflesuite/truffle/issues/348).
HDWalletProvider crashes solidity-coverage, so its constructor shouldn't be invoked while running this tool.
A workaround can be found at the zeppelin-solidity project
[here](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/truffle.js#L8-L10), where a
shell script is used to set an environment variable which `truffle.js` checks before instantiating the wallet.

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
also lint your submission with `npm run lint`. Bugs can be reported in the
[issues](https://github.com/sc-forks/solidity-coverage/issues).  

### Contributors
+ [@area](https://github.com/area)
+ [@cgewecke](https://github.com/cgewecke)
+ [@adriamb](https://github.com/adriamb)
