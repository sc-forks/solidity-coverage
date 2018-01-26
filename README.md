# solidity-coverage

[![Join the chat at https://gitter.im/sc-forks/solidity-coverage](https://badges.gitter.im/sc-forks/solidity-coverage.svg)](https://gitter.im/sc-forks/solidity-coverage?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![npm version](https://badge.fury.io/js/solidity-coverage.svg)](https://badge.fury.io/js/solidity-coverage)
[![CircleCI](https://circleci.com/gh/sc-forks/solidity-coverage.svg?style=svg)](https://circleci.com/gh/sc-forks/solidity-coverage)
[![codecov](https://codecov.io/gh/sc-forks/solidity-coverage/branch/master/graph/badge.svg)](https://codecov.io/gh/sc-forks/solidity-coverage)
[![Stories in Ready](https://badge.waffle.io/sc-forks/solidity-coverage.png?label=ready&title=Ready)](https://waffle.io/sc-forks/solidity-coverage?utm_source=badge)

### Code coverage for Solidity testing
![coverage example](https://cdn-images-1.medium.com/max/800/1*uum8t-31bUaa6dTRVVhj6w.png)

+ For more details about what this is, how it works and potential limitations, see
[the accompanying article](https://blog.colony.io/code-coverage-for-solidity-eecfa88668c2).
+ `solidity-coverage` is in development and **its accuracy is unknown.** If you
find discrepancies between the coverage report and your suite's behavior, please open an
[issue](https://github.com/sc-forks/solidity-coverage/issues).
+ `solidity-coverage` is [Solcover](https://github.com/JoinColony/solcover)

### Install
```
$ npm install --save-dev solidity-coverage
```

### Run
```
$ ./node_modules/.bin/solidity-coverage
```

Tests run signficantly slower while coverage is being generated. Your contracts are double-compiled
and a 1 to 2 minute delay between the end of the second compilation and the beginning of test execution
is possible if your test suite is large. Large Solidity files can also take a while to instrument.

**Important: breaking change for versions >= `0.4.3`**
+ solidity-coverage now expects a globally installed truffle in your environment / on CI. If you
prefer to control which Truffle version your tests are run with, please see the FAQ for
[running truffle as a local dependency](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-truffle-as-a-local-dependency).

+ Solidity fixtures / mocks / tests stored in the `tests/` directory are no longer supported. If your suite uses native Soldity testing or accesses contracts via mocks stored in `tests/` (a la Zeppelin), coverage will trigger test errors because it's unable to rewrite your contract ABIs appropriately. Mocks should be relocated to the root folder's `contracts` directory. More on why this is necessary at issue [146](https://github.com/sc-forks/solidity-coverage/issues/146)

### Network Configuration

By default, solidity-coverage generates a stub `truffle.js` that accomodates its special gas needs and
connects to a modified version of testrpc on port 8555. If your tests will run on the development network
using a standard `truffle.js` and testrpc instance, you shouldn't have to do any configuration.
If your tests depend on logic or special options added to `truffle.js` you should declare a coverage
network there following the example below.

**Example**
```javascript
module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*"
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,         // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01      // <-- Use this low gas price
    },
    ...etc...
  }
};
```
### Options

You can also create a `.solcover.js` config file in the root directory of your project and specify
additional options if necessary:

**Example:**
```javascript
module.exports = {
    port: 6545,
    testrpcOptions: '-p 6545 -u 0x54fd80d6ae7584d8e9a19fe1df43f04e5282cc43',
    testCommand: 'mocha --timeout 5000',
    norpc: true,
    dir: './secretDirectory',
    copyPackages: ['zeppelin-solidity'],
    skipFiles: ['Routers/EtherRouter.sol']
};
```


| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| accounts | *Number* | 35 | Number of accounts to launch testrpc with. |
| port   | *Number* | 8555 | Port to run testrpc on / have truffle connect to |
| norpc | *Boolean* | false | Prevent solidity-coverage from launching its own testrpc. Useful if you are managing a complex test suite with a [shell script](https://github.com/OpenZeppelin/zeppelin-solidity/blob/ed872ca0a11c4926f8bb91dd103bea1378a3384c/scripts/coverage.sh) |
| testCommand | *String* | `truffle test` |  Run an arbitrary test command. ex: `mocha --timeout 5000`. NB: Also set the `port` option to whatever your tests require (probably 8545). |
| testrpcOptions | *String* | `--port 8555` | options to append to a command line invocation of testrpc. NB: Using this overwrites the defaults so always specify a port in this string *and* in the `port` option |
| copyNodeModules | *Boolean* | false | Copies `node_modules` into the coverage environment. May significantly increase the time for coverage to complete if enabled. Useful if your contracts import solidity files from an npm installed package. |
| copyPackages | *Array* | `[]` | Copies specific `node_modules` packages into the coverage environment. May significantly reduce the time for coverage to complete compared to `copyNodeModules`. Useful if your contracts import solidity files from an npm installed package. |
| skipFiles | *Array* | `['Migrations.sol']` | Array of contracts or folders (with paths expressed relative to the `contracts` directory) that should be skipped when doing instrumentation. `Migrations.sol` is skipped by default, and does not need to be added to this configuration option if it is used. |
| dir | *String* | `.` | Solidity-coverage copies all the assets in your root directory (except `node_modules`) to a special folder where it instruments the contracts and executes the tests. `dir` allows you to define a relative path from the root directory to those assets. Useful if your contracts & tests are within their own folder as part of a larger project.|

### FAQ

Solutions to common issues people run into using this tool:

+ [Running out of gas](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-gas)
+ [Running out of memory (locally and in CI)](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-memory-locally-and-in-ci)
+ [Running out of time (in mocha)](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-time-in-mocha)
+ [Running on windows](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-on-windows)
+ [Running testrpc-sc on its own](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-testrpc-sc-on-its-own)
+ [Running truffle as a local dependency](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-truffle-as-a-local-dependency)
+ [Using alongside HDWalletProvider](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#using-alongside-hdwalletprovider)
+ [Integrating into CI](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#continuous-integration-installing-metacoin-on-travisci-with-coveralls)
+ [Why are asserts and requires highlighted as branch points?](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#why-has-my-branch-coverage-decreased-why-is-assert-being-shown-as-a-branch-point)
+ [Why are `send` and `transfer` throwing in my tests?](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#why-are-send-and-transfer-throwing)


### Example reports
+ [metacoin](https://sc-forks.github.io/metacoin/) (Istanbul HTML)
+ [zeppelin-solidity](https://coveralls.io/github/OpenZeppelin/zeppelin-solidity?branch=master)  (Coveralls)
+ [gnosis-contracts](https://codecov.io/gh/gnosis/gnosis-contracts/tree/master/contracts)  (Codecov)

### Contribution Guidelines

Contributions are welcome! If you're opening a PR that adds features please consider writing some
[unit tests](https://github.com/sc-forks/solidity-coverage/tree/master/test) for them. You could
also lint your submission with `npm run lint`. Bugs can be reported in the
[issues](https://github.com/sc-forks/solidity-coverage/issues).

### Contributors
+ [@area](https://github.com/area)
+ [@cgewecke](https://github.com/cgewecke)
+ [@adriamb](https://github.com/adriamb)
+ [@cag](https://github.com/cag)
+ [@maurelian](https://github.com/maurelian)
+ [@rudolfix](https://github.com/rudolfix)
+ [@phiferd](https://github.com/phiferd)
+ [@e11io](https://github.com/e11io)
+ [@elenadimitrova](https://github.com/elenadimitrova)
+ [@ukstv](https://github.com/ukstv)
