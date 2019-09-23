# solidity-coverage

[![Join the chat at https://gitter.im/sc-forks/solidity-coverage](https://badges.gitter.im/sc-forks/solidity-coverage.svg)](https://gitter.im/sc-forks/solidity-coverage?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![npm version](https://badge.fury.io/js/solidity-coverage.svg)](https://badge.fury.io/js/solidity-coverage)
[![CircleCI](https://circleci.com/gh/sc-forks/solidity-coverage.svg?style=svg)](https://circleci.com/gh/sc-forks/solidity-coverage)
[![codecov](https://codecov.io/gh/sc-forks/solidity-coverage/branch/master/graph/badge.svg)](https://codecov.io/gh/sc-forks/solidity-coverage)

### Code coverage for Solidity testing
![coverage example](https://cdn-images-1.medium.com/max/800/1*uum8t-31bUaa6dTRVVhj6w.png)

+ For more details about what this is, how it works and potential limitations, see
[the accompanying article](https://blog.colony.io/code-coverage-for-solidity-eecfa88668c2).
+ `solidity-coverage` is [Solcover](https://github.com/JoinColony/solcover)

### Install
```
$ npm install --save-dev solidity-coverage@beta
```

### Truffle V5

**Add** "solidity-coverage" to your plugins array in `truffle-config.js`
```javascript
module.exports = {
  networks: {...},
  plugins: ["solidity-coverage"]
}
```
**Run**
```
truffle run coverage [options]
```

### Usage notes:
+ Coverage runs tests a little more slowly.
+ Coverage [distorts gas consumption][13]. Tests that check exact gas consumption should be skipped.
+ Coverage launches its own in-process ganache server.
+ You can set [ganache options][1] using the `providerOptions` key in your `.solcover.js` config.

### Command Options
| Option <img width=200/> | Example <img width=700/>| Description <img width=1000/> |
|--------------|------------------------------------|--------------------------------|
| file     | `--file="test/registry/*.js"`    | Filename or glob describing a subset of JS tests to run. (Globs must be enclosed by quotes.)|
| solcoverjs | `--solcoverjs ./../.solcover.js` | Relative path from working directory to config. Useful for monorepo packages that share settings. (Path must be "./" prefixed) |
| network    | `--network development` | Use network settings defined in the Truffle config |
| temp[<sup>*</sup>][14]       | `--temp build`   | :warning: **Caution** :warning:  Path to a *disposable* folder to store compilation artifacts in. Useful when your test setup scripts include hard-coded paths to a build directory. [More...][14] |
| version    |                                | Version info |
| help       |                                | Usage notes  |

[<sup>*</sup> Advanced use][14]

### Config Options

Additional options can be specified in a `.solcover.js` config file located in
the root directory of your project.

**Example:**
```javascript
module.exports = {
  skipFiles: ['Routers/EtherRouter.sol']
};
```


| Option <img width=200/>| Type <img width=200/> | Default <img width=700/> | Description <img width=1000/> |
| ------ | ---- | ------- | ----------- |
| silent | *Boolean* | false | Suppress logging output |
| client | *Object* | `require("ganache-core")` | Useful if you need a specific ganache version. |
| providerOptions | *Object* | `{ }` | [ganache-core options][1]  |
| skipFiles | *Array* | `['Migrations.sol']` | Array of contracts or folders (with paths expressed relative to the `contracts` directory) that should be skipped when doing instrumentation. |
| istanbulReporter | *Array* | `['html', 'lcov', 'text']` | [Istanbul coverage reporters][2]  |
| mocha | *Object* | `{ }` | [Mocha options][3] to merge into existing mocha config. `grep` and `invert` are useful for skipping certain tests under coverage using tags in the test descriptions.|
| onServerReady[<sup>*</sup>][14] | *Function* |   | Hook run *after* server is launched, *before* the tests execute. Useful if you need to use the Oraclize bridge or have setup scripts which rely on the server's availability. [More...][14] |
| onCompileComplete[<sup>*</sup>][14] | *Function* |  | Hook run *after* compilation completes, *before* tests are run. Useful if you have secondary compilation steps or need to modify built artifacts. [More...][14]|
| onTestsComplete[<sup>*</sup>][14] | *Function* |  | Hook run *after* the tests complete, *before* Istanbul reports are generated. [More...][14]|
| onIstanbulComplete[<sup>*</sup>][14] | *Function* |  | Hook run *after* the Istanbul reports are generated, *before* the ganache server is shut down. Useful if you need to clean resources up. [More...][14]|

[<sup>*</sup> Advanced use][14]

### FAQ

Common problems & questions:

+ [Running out of gas][4]
+ [Running out of memory (locally and in CI)][5]
+ [Running out of time (in mocha)][6]
+ [Running in CI][7]
+ [Why are asserts and requires highlighted as branch points?][8]


### Example reports
+ [metacoin][9] (Istanbul HTML)
+ [openzeppelin-solidity][10](Coveralls)

### Contribution Guidelines

Contributions are welcome! If you're opening a PR that adds features or options *please consider writing full
[unit tests][11] for them*. (We've built simple fixtures for almost every contingency and are happy to add some 
for your case if necessary). 

Set up the development environment with:
```
$ git clone https://github.com/sc-forks/solidity-coverage.git
$ yarn
```

[1]: https://github.com/trufflesuite/ganache-core#options
[2]: https://istanbul.js.org/docs/advanced/alternative-reporters/
[3]: https://mochajs.org/api/mocha
[4]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-gas
[5]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-memory
[6]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-time-in-mocha
[7]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#continuous-integration
[8]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#notes-on-branch-coverage
[9]: https://sc-forks.github.io/metacoin/
[10]: https://coveralls.io/github/OpenZeppelin/openzeppelin-solidity?branch=master
[11]: https://github.com/sc-forks/solidity-coverage/tree/master/test/units
[12]: https://github.com/sc-forks/solidity-coverage/issues
[13]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#notes-on-gas-distortion
[14]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/advanced.md

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
+ [@yxliang01](https://github.com/yxliang01)
