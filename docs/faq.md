# FAQ

## Continuous Integration


**Step 1: Create a metacoin project & install coverage tools**

```bash
$ truffle unbox metacoin

# Install coverage dependencies
$ npm init
$ npm install --save-dev coveralls
$ npm install --save-dev solidity-coverage
```

**Step 2: Add test and coverage scripts to the `package.json`:**

```javascript
"scripts": {
  "test": "truffle test",
  "coverage": "truffle run coverage"
},
```

**Step 3: Add solidity-coverage to the plugins array in truffle-config.js:**

**Step 4: Create a .travis.yml:**

```yml
dist: trusty
language: node_js
node_js:
  - '10'
install:
  - npm install -g truffle 
script:
  - npm run coverage && coverage/lcov.info | coveralls
```
**NB:** It's best practice to run coverage in a parallel CI build rather than assume its equivalence to `truffle test`. Coverage uses block gas limits far above the current blocklimit and rewrites your contracts in ways that might affect their behavior. 

**Step 5: Toggle the project on at Travis and Coveralls and push.**

[It should look like this](https://coveralls.io/github/sc-forks/metacoin)

**Appendix: Coveralls vs. Codecov**

**TLDR: We strongly recommend coveralls for its accuracy in reporting branch execution.**

[Codecov.io](https://codecov.io/) is another CI coverage provider (we use it for this project). They're very reliable, easy to integrate with and have a nice UI. Unfortunately we haven't found a way to get their reports to show branch coverage. Coveralls has excellent branch coverage reporting out of the box (see below).

![missed_branch](https://user-images.githubusercontent.com/7332026/28502310-6851f79c-6fa4-11e7-8c80-c8fd80808092.png)


## Running out of memory (Locally and in CI)

If your target contains dozens of large contracts, you may run up against node's memory cap during the
contract compilation step. This can be addressed by setting the size of the memory space allocated to the command 
when you run it. (NB: you must use the relative path to the truffle `bin` in node_modules)
```
$ node --max-old-space-size=4096 ../node_modules/.bin/truffle run coverage [options]
```

## Running out of time (in mocha)

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

+ If you have *hardcoded gas costs* into your tests, some of them may error.
+ If you are running *gas simulation tests*, they will not be accurate. 
+ If your *solidity logic constrains gas usage* within narrow bounds, it may fail. (`.send` and `.transfer` typically run as expected, however).

Using `estimateGas` to calculate your gas costs or allowing your transactions to use the default gas 
settings should be more resilient in most cases.

Gas metering within Solidity is widely viewed as a problematic design pattern because EVM gas costs are recalibrated
from fork to fork. Relying on them can result in deployed contracts ceasing to behave as intended.

### Notes on branch coverage

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
