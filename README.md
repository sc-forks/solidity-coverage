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
### Usage notes:
+ For pragma solidity >=0.4.22 <0.6.0 / Petersburg
+ Coverage runs tests a little more slowly.
+ Coverage distorts gas consumption. 
+ Coverage launches its own in-process ganache instance. You can
  set [ganache options](https://github.com/trufflesuite/ganache-core#options) via
  the `providerOptions` key in your `.solcover.js` config file.

### Truffle >= V5: setup and run

Add "solidity-coverage" to your plugins array in `truffle-config.js`
```javascript
module.exports = {
  networks: {...},
  plugins: ["solidity-coverage"]
}
```
Run
```
truffle run coverage [options]
```


### Command Options
| Option       | Example                        | Description |
|--------------|--------------------------------|-------------|
| --file       | --file="test/registry/*.js"    | Filename or glob describing a subset of JS tests to run. (Globs must be enclosed by quotes.)|
| --solcoverjs | --solcoverjs ./../.solcover.js | Relative path from working directory to config. Useful for monorepo packages that share settings. (Path must be "./" prefixed) |
| --version    |                                | Version info |
| --help       |                                | Usage notes  |
|<img width=170/>|<img width=500/>              |<img width=100/>|

### Config Options

Additional options can be specified in a `.solcover.js` config file located in
the root directory of your project.

**Example:**
```javascript
module.exports = {
  skipFiles: ['Routers/EtherRouter.sol']
};
```


| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| client | *Object* | require("truffle").ganache | Useful if you need a specific ganache version. (usage: `client: require("ganache-core")`)|
| providerOptions | *Object* | {} | ganache-core options (ex: `network_id: 55`). Complete list of options [here](https://github.com/trufflesuite/ganache-core#options).  |
| skipFiles | *Array* | `['Migrations.sol']` | Array of contracts or folders (with paths expressed relative to the `contracts` directory) that should be skipped when doing instrumentation. `Migrations.sol` is skipped by default, and does not need to be added to this configuration option if it is used. |
| istanbulReporter | *Array* | ['html', 'lcov', 'text'] | Coverage reporters for Istanbul. Optional reporter replaces the default reporters. |

### FAQ

Common problems & questions:

+ [Running out of gas](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-gas)
+ [Running out of memory (locally and in CI)](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-memory-locally-and-in-ci)
+ [Running out of time (in mocha)](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-time-in-mocha)
+ [Running in CI](https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#continuous-integration-installing-metacoin-on-travisci-with-coveralls)
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
