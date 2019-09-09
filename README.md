# solidity-coverage

[![Join the chat at https://gitter.im/sc-forks/solidity-coverage](https://badges.gitter.im/sc-forks/solidity-coverage.svg)](https://gitter.im/sc-forks/solidity-coverage?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![npm version](https://badge.fury.io/js/solidity-coverage.svg)](https://badge.fury.io/js/solidity-coverage)
[![CircleCI](https://circleci.com/gh/sc-forks/solidity-coverage.svg?style=svg)](https://circleci.com/gh/sc-forks/solidity-coverage)
[![codecov](https://codecov.io/gh/sc-forks/solidity-coverage/branch/master/graph/badge.svg)](https://codecov.io/gh/sc-forks/solidity-coverage)

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
Set a `coverage` network in truffle-config.js (see [Network Configuration](#network-configuration)) and then run:
```
$ npx solidity-coverage
```

### Usage notes:
+ For pragma solidity >=0.4.22 <0.6.0 / Petersburg / Truffle v4 and v5
+ Tests run more slowly while coverage is being generated.
+ Your contracts will be double-compiled and a (long) delay between compilation and
the beginning of test execution is possible if your contracts are large.
+ Truffle should be globallly installed in your environment.. If you prefer running truffle as
a local dependency, please see [this section](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-truffle-as-a-local-dependency) of the FAQ.
+ If your suite uses native Solidity testing or accesses contracts via mocks stored in `tests/` (a la Zeppelin), coverage will trigger test errors because it can't control the way truffle compiles that folder. Mocks should be relocated to the root `contracts` directory. More on why this is necessary at issue [146](https://github.com/sc-forks/solidity-coverage/issues/146)

### Network Configuration

By default, this tool connects to a coverage-enabled fork of ganache-cli
called **testrpc-sc** on port 8555.
+ it's a dependency - there's nothing extra to download.
+ the solidity-coverage command launches it automatically in the background. (See [this section of the FAQ](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-testrpc-sc-on-its-own) if you need to launch it separately yourself)

In `truffle-config.js`, add a coverage network following the example below.

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

Additional options can be specified in a `.solcover.js` config file located in
the root directory of your project.

**Example:**
```javascript
module.exports = {
    port: 6545,
    testrpcOptions: '-p 6545 -u 0x54fd80d6ae7584d8e9a19fe1df43f04e5282cc43',
    testCommand: 'mocha --timeout 5000',
    norpc: true,
    dir: './secretDirectory',
    copyPackages: ['openzeppelin-solidity'],
    skipFiles: ['Routers/EtherRouter.sol']
};
```


| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| accounts | *Number* | 35 | Number of accounts to launch testrpc with. |
| port   | *Number* | 8555 | Port to run testrpc on / have truffle connect to |
| norpc | *Boolean* | false | Prevent solidity-coverage from launching its own testrpc. Useful if you are managing a complex test suite with a [shell script](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/ed872ca0a11c4926f8bb91dd103bea1378a3384c/scripts/coverage.sh) |
| testCommand | *String* | `truffle test` |  Run an arbitrary test command. ex: `mocha --timeout 5000`. NB: Also set the `port` option to whatever your tests require (probably 8545). |
| testrpcOptions | *String* | `--port 8555` | options to append to a command line invocation of testrpc. NB: Using this overwrites the defaults so always specify a port in this string *and* in the `port` option |
| copyNodeModules | *Boolean* | false | :warning:  **DEPRECATED** use `copyPackages` instead :warning: Copies `node_modules` into the coverage environment. May significantly increase the time for coverage to complete if enabled. Useful if your contracts import solidity files from an npm installed package (and your node_modules is small). |
| copyPackages | *Array* | `[]` | Copies specific `node_modules` packages into the coverage environment. May significantly reduce the time for coverage to complete compared to `copyNodeModules`. Useful if your contracts import solidity files from an npm installed package. |
| skipFiles | *Array* | `['Migrations.sol']` | Array of contracts or folders (with paths expressed relative to the `contracts` directory) that should be skipped when doing instrumentation. `Migrations.sol` is skipped by default, and does not need to be added to this configuration option if it is used. |
| deepSkip | boolean | false | Use this if instrumentation hangs on large, skipped files (like Oraclize). It's faster. |
| dir | *String* | `.` | Solidity-coverage copies all the assets in your root directory (except `node_modules`) to a special folder where it instruments the contracts and executes the tests. `dir` allows you to define a relative path from the root directory to those assets. Useful if your contracts & tests are within their own folder as part of a larger project.|
| buildDirPath | *String* | `/build/contracts` | Build directory path for compiled smart contracts |
| istanbulReporter | *Array* | ['html', 'lcov', 'text'] | Coverage reporters for Istanbul. Optional reporter replaces the default reporters. |

### FAQ

Solutions to common problems people run into:

+ [Running out of gas](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-gas)
+ [Running out of memory (locally and in CI)](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-memory-locally-and-in-ci)
+ [Running out of time (in mocha)](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-time-in-mocha)
+ [Running on windows](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-on-windows)
+ [Running testrpc-sc on its own](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-testrpc-sc-on-its-own)
+ [Running truffle as a local dependency](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-truffle-as-a-local-dependency)
+ [Integrating into CI](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#continuous-integration-installing-metacoin-on-travisci-with-coveralls)
+ [Why are asserts and requires highlighted as branch points?](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#why-has-my-branch-coverage-decreased-why-is-assert-being-shown-as-a-branch-point)


### Example reports
+ [metacoin](https://sc-forks.github.io/metacoin/) (Istanbul HTML)
+ [openzeppelin-solidity](https://coveralls.io/github/OpenZeppelin/openzeppelin-solidity?branch=master)  (Coveralls)

### Contribution Guidelines

Contributions are welcome! If you're opening a PR that adds features please consider writing some
[unit tests](https://github.com/sc-forks/solidity-coverage/tree/master/test) for them.  Bugs can be
reported in the [issues](https://github.com/sc-forks/solidity-coverage/issues).

Set up the development environment with:
```
$ git clone https://github.com/sc-forks/solidity-coverage.git
$ yarn
```

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
+ [@vdrg](https://github.com/vdrg)
+ [@andresliva](https://github.com/andresilva)
+ [@DimitarSD](https://github.com/DimitarSD)
+ [@sohkai](https://github.com/sohkai)
+ [@bingen](https://github.com/bingen)
+ [@pinkiebell](https://github.com/pinkiebell)
+ [@obernardovieira](https://github.com/obernardovieira)
+ [@angus-hamill](https://github.com/angus-hamill)
+ [@kandrianov](https://github.com/kandrianov)
