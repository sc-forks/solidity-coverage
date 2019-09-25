# FAQ

- [Table of Contents](#contents)
  * [Continuous Integration](#continuous-integration)
  * [Running out of memory](#running-out-of-memory)
  * [Running out of time](#running-out-of-time)
  * [Notes on gas distortion](#notes-on-gas-distortion)
  * [Notes on branch coverage](#notes-on-branch-coverage)

## Continuous Integration

An example using Truffle MetaCoin, TravisCI, and Coveralls:

**Step 1: Create a metacoin project & install coverage tools**

```bash
$ mkdir metacoin && cd metacoin
$ truffle unbox metacoin

# Install coverage and development dependencies
$ npm init
$ npm install --save-dev truffle
$ npm install --save-dev coveralls
$ npm install --save-dev solidity-coverage
```

**Step 2: Add solidity-coverage to the plugins array in truffle-config.js:**

```javascript
module.exports = {
  networks: {...},
  plugins: ["solidity-coverage"]
}
```

**Step 3: Create a .travis.yml:**

```yml
dist: trusty
language: node_js
node_js:
  - '10'
install:
  - npm install
script:
  - npx truffle run coverage
  - cat coverage/lcov.info | coveralls
```
**NB:** It's best practice to run coverage as a separate CI job rather than assume its
equivalence to `test`. Coverage uses block gas settings far above the network limits,
ignores [EIP 170][4] and rewrites your contracts in ways that might affect
their behavior.

**Step 4: Toggle the project on at Travis and Coveralls and push.**

[It should look like this][1]

**Appendix: Coveralls vs. Codecov**

**TLDR: We recommend Coveralls for the accuracy of its branch reporting.**

We use [Codecov.io][2] here as a coverage provider for our JS tests - they're great. Unfortunately we haven't found a way to get their reports to show branch coverage for Solidity. Coveralls has excellent Solidity branch coverage reporting out of the box (see below).

![missed_branch][3]


## Running out of memory

If your target contains dozens of large contracts, you may run up against node's memory cap during the
contract compilation step. This can be addressed by setting the size of the memory space allocated to the command
when you run it. (NB: you must use the relative path to the truffle `bin` in node_modules)
```
$ node --max-old-space-size=4096 ../node_modules/.bin/truffle run coverage [options]
```

## Running out of time

Truffle sets a default mocha timeout of 5 minutes. Because tests run slower under coverage, it's possible to hit this limit with a test that iterates hundreds of times before producing a result. Timeouts can be disabled by configuring the mocha option in `.solcover.js` as below: (ProTip courtesy of [@cag](https://github.com/cag))

```javascript
module.exports = {
  mocha: {
    enableTimeouts: false
  }
}
```

## Notes on gas distortion

Solidity-coverage instruments by injecting statements into your code, increasing its execution costs.

+ If you are running gas usage simulations, they will **not be accurate**.
+ If you have hardcoded gas costs into your tests, some of them may **error**.
+ If your solidity logic constrains gas usage within narrow bounds, it may **fail**. 
  + Solidity's `.send` and `.transfer` methods usually work fine though.

Using `estimateGas` to calculate your gas costs or allowing your transactions to use the default gas
settings should be more resilient in most cases.

Gas metering within Solidity is increasingly seen as anti-pattern because EVM gas costs are recalibrated from fork to fork. Depending on their exact values can result in deployed contracts ceasing to behave as intended.

## Notes on branch coverage

Solidity-coverage treats `assert` and `require` as code branches because they check whether a condition is true or not. If it is, they allow execution to proceed. If not, they throw, and all changes are reverted. Indeed, prior to [Solidity 0.4.10](https://github.com/ethereum/solidity/releases/tag/v0.4.10), when `assert` and `require` were introduced, this functionality was achieved by code that looked like

```
if (!x) throw;
```
rather than

```
require(x)
```

Clearly, the coverage should be the same in these situations, as the code is (functionally) identical. Older versions of solidity-coverage did not treat these as branch points, and they were not considered in the branch coverage filter. Newer versions *do* count these as branch points, so if your tests did not include failure scenarios for `assert` or `require`, you may see a decrease in your coverage figures when upgrading `solidity-coverage`.

If an `assert` or `require` is marked with an `I` in the coverage report, then during your tests the conditional is never true. If it is marked with an `E`, then it is never false.

[1]: https://coveralls.io/builds/25886294
[2]: https://codecov.io/ 
[3]: https://user-images.githubusercontent.com/7332026/28502310-6851f79c-6fa4-11e7-8c80-c8fd80808092.png
[4]: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-170.md
