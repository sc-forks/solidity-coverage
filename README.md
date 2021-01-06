# solidity-coverage

[![Gitter chat](https://badges.gitter.im/sc-forks/solidity-coverage.svg)][18]
![npm (tag)](https://img.shields.io/npm/v/solidity-coverage/latest)
[![CircleCI](https://circleci.com/gh/sc-forks/solidity-coverage.svg?style=svg)][20]
[![codecov](https://codecov.io/gh/sc-forks/solidity-coverage/branch/master/graph/badge.svg)][21]
[![buidler](https://buidler.dev/buidler-plugin-badge.svg?1)][26]


## Code coverage for Solidity testing
![coverage example][22]

+ For more details about what this is, how it works and potential limitations,
  see [the accompanying article][16].
+ `solidity-coverage` is [Solcover][17]

## Install
```
$ npm install --save-dev solidity-coverage
```

**Resources**:
+ [0.7.0 release notes][31]
+ [A guide][29] to upgrading from 0.6.x to 0.7.x
+ [0.6.3 docs][30]

### Truffle V5

**Add** this package to your plugins array in `truffle-config.js` ([Truffle docs][27])
```javascript
module.exports = {
  networks: {...},
  plugins: ["solidity-coverage"]
}
```
**Run**
```
truffle run coverage [command-options]
```

### Hardhat

Beginning with v0.7.12, this tool supports Hardhat and runs directly on
HardhatEVM.

**Require** the plugin in `hardhat.config.js` ([Hardhat docs][26])
```javascript
require('solidity-coverage')
```

**Run**
```
npx hardhat coverage [command-options]
```

(Additional Hardhat-specific info can be found [here][37])

### Buidler [Deprecated]

**Add** the plugin in `buidler.config.js` ([Buidler docs][26])
```javascript
usePlugin('solidity-coverage')

module.exports = {
  networks: {
    coverage: {
      url: 'http://localhost:8555'
    }
  },
}
```
**Run**
```
npx buidler coverage --network coverage [command-options]
```

**Buidler Project Examples:**

+ Simple: [buidler-metacoin][32]
+ More complex: [MolochDao/moloch][33]

### @openzeppelin/test-environment

OpenZeppelin have written their own coverage generation scripts for `test-environment` using the solidity-coverage API.
A working example can be found at [openzeppelin-contracts, here.][35]

## Usage notes:
+ Coverage runs tests a little more slowly.
+ Coverage launches its own in-process ganache server.
+ You can set [ganache options][1] using the `providerOptions` key in your `.solcover.js` [config][15].
+ Coverage [distorts gas consumption][13]. Tests that check exact gas consumption should be [skipped][24].
+ :warning:  Contracts are compiled **without optimization**. Please report unexpected compilation faults to [issue 417][25]

## Command Options
| Option <img width=200/> | Example <img width=750/>| Description <img width=1000/> |
|--------------|------------------------------------|--------------------------------|
| file | `--file="test/registry/*.js"`    | (Truffle) Filename or glob describing a subset of tests to run. (Globs must be enclosed by quotes.)|
| testfiles  | `--testfiles "test/registry/*.ts"` | (Buidler) Test file(s) to run. (Globs must be enclosed by quotes.)|
| solcoverjs | `--solcoverjs ./../.solcover.js` | Relative path from working directory to config. Useful for monorepo packages that share settings. (Path must be "./" prefixed) |
| network    | `--network development` | Use network settings defined in the Truffle or Buidler config |
| temp[<sup>*</sup>][14]       | `--temp build`   | :warning: **Caution** :warning:  Path to a *disposable* folder to store compilation artifacts in. Useful when your test setup scripts include hard-coded paths to a build directory. [More...][14] |
| matrix   | `--matrix` | Generate a JSON object that maps which mocha tests hit which lines of code. (Useful
as an input for some fuzzing, mutation testing and fault-localization algorithms.) [More...][38]|

[<sup>*</sup> Advanced use][14]

## Config Options

Additional options can be specified in a `.solcover.js` config file located in the root directory
of your project.

**Example:**
```javascript
module.exports = {
  skipFiles: ['Routers/EtherRouter.sol']
};
```

| Option <img width=200/>| Type <img width=200/> | Default <img width=1300/> | Description <img width=800/> |
| ------ | ---- | ------- | ----------- |
| silent | *Boolean* | false | Suppress logging output |
| client | *Object* | `require("ganache-core")` | Useful if you need a specific ganache version. |
| providerOptions | *Object* | `{ }` | [ganache-core options][1]  |
| skipFiles | *Array* | `['Migrations.sol']` | Array of contracts or folders (with paths expressed relative to the `contracts` directory) that should be skipped when doing instrumentation. |
| measureStatementCoverage | *boolean* | `true` | Computes statement (in addition to line) coverage. [More...][34] |
| measureFunctionCoverage | *boolean* | `true` | Computes function coverage. [More...][34] |
| measureModifierCoverage | *boolean* | `true` | Computes each modifier invocation as a code branch. [More...][34] |
| modifierWhitelist | *String[]* | `[]` | List of modifier names (ex: "onlyOwner") to exclude from branch measurement. (Useful for modifiers which prepare something instead of acting as a gate.)) |
| matrixOutputPath | *String* | `./testMatrix.json` | Relative path to write test matrix JSON object to. [More...][38] |
| istanbulFolder | *String* | `./coverage` |  Folder location for Istanbul coverage reports. |
| istanbulReporter | *Array* | `['html', 'lcov', 'text', 'json']` | [Istanbul coverage reporters][2]  |
| mocha | *Object* | `{ }` | [Mocha options][3] to merge into existing mocha config. `grep` and `invert` are useful for skipping certain tests under coverage using tags in the test descriptions.|
| onServerReady[<sup>*</sup>][14] | *Function* |   | Hook run *after* server is launched, *before* the tests execute. Useful if you need to use the Oraclize bridge or have setup scripts which rely on the server's availability. [More...][23] |
| onCompileComplete[<sup>*</sup>][14] | *Function* |  | Hook run *after* compilation completes, *before* tests are run. Useful if you have secondary compilation steps or need to modify built artifacts. [More...][23]|
| onTestsComplete[<sup>*</sup>][14] | *Function* |  | Hook run *after* the tests complete, *before* Istanbul reports are generated. [More...][23]|
| onIstanbulComplete[<sup>*</sup>][14] | *Function* |  | Hook run *after* the Istanbul reports are generated, *before* the ganache server is shut down. Useful if you need to clean resources up. [More...][23]|

[<sup>*</sup> Advanced use][14]

## API

Solidity-coverage's core methods and many utilities are available as an API.

```javascript
const CoverageAPI = require('solidity-coverage/api');
```

[Documentation available here][28].

## FAQ

Common problems & questions:

+ [Running in CI][7]
+ [Running out of gas][13]
+ [Running out of time][6]
+ [Running out of memory][5]
+ [Why are `require` statements highlighted as branch points?][8]


## Example reports
+ [metacoin][9] (Istanbul HTML)
+ [openzeppelin-solidity][10](Coveralls)

## Contribution Guidelines

Contributions are welcome! If you're opening a PR that adds features or options *please consider
writing full [unit tests][11] for them*. (We've built simple fixtures for almost everything
and are happy to add some for your case if necessary).


Set up the development environment with:
```
$ git clone https://github.com/sc-forks/solidity-coverage.git
$ yarn
```

## Contributors
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
+ [@maxsam4](https://github.com/maxsam4)
+ [@justinjmoses](https://github.com/justinjmoses)

[1]: https://github.com/trufflesuite/ganache-core#options
[2]: https://istanbul.js.org/docs/advanced/alternative-reporters/
[3]: https://mochajs.org/api/mocha
[4]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-gas
[5]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-memory
[6]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-time
[7]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#continuous-integration
[8]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#notes-on-branch-coverage
[9]: https://sc-forks.github.io/metacoin/
[10]: https://coveralls.io/github/OpenZeppelin/openzeppelin-solidity?branch=master
[11]: https://github.com/sc-forks/solidity-coverage/tree/master/test/units
[12]: https://github.com/sc-forks/solidity-coverage/issues
[13]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#notes-on-gas-distortion
[14]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/advanced.md
[15]: #config-options
[16]: https://blog.colony.io/code-coverage-for-solidity-eecfa88668c2
[17]: https://github.com/JoinColony/solcover
[18]: https://gitter.im/sc-forks/solidity-coverage?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
[19]: https://badge.fury.io/js/solidity-coverage
[20]: https://circleci.com/gh/sc-forks/solidity-coverage
[21]: https://codecov.io/gh/sc-forks/solidity-coverage
[22]: https://cdn-images-1.medium.com/max/800/1*uum8t-31bUaa6dTRVVhj6w.png
[23]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/advanced.md#workflow-hooks
[24]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/advanced.md#skipping-tests
[25]: https://github.com/sc-forks/solidity-coverage/issues/417
[26]: https://buidler.dev/
[27]: https://www.trufflesuite.com/docs
[28]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/api.md
[29]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/upgrade.md#upgrading-from-06x-to-070
[30]: https://github.com/sc-forks/solidity-coverage/tree/0.6.x-final#solidity-coverage
[31]: https://github.com/sc-forks/solidity-coverage/releases/tag/v0.7.0
[32]: https://github.com/sc-forks/buidler-e2e/tree/coverage
[33]: https://github.com/sc-forks/moloch
[34]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/advanced.md#reducing-the-instrumentation-footprint
[35]: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/e5fbbda9bac49039847a7ed20c1d966766ecc64a/scripts/coverage.js
[36]: https://hardhat.org/
[37]: https://github.com/sc-forks/solidity-coverage/blob/master/HARDHAT_README.md
[38]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/advanced.md#generating-a-test-matrix

