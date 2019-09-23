# FAQ

### Continuous Integration


**Step 1: Create a metacoin project & install coverage tools**

```bash
$ truffle unbox metacoin
$ rm test/TestMetacoin.sol  # No solidity tests, sorry.

# Install coverage dependencies
$ npm init
$ npm install --save-dev coveralls
$ npm install --save-dev solidity-coverage
```

**Step 2: Add test and coverage scripts to the `package.json`:**

```javascript
"scripts": {
    "test": "truffle test",
    "coverage": "npx solidity-coverage"
},
```

**Step 3: Create a .travis.yml:**

```yml
sudo: required
dist: trusty
language: node_js
node_js:
  - '10'
install:
  - npm install -g truffle
  - npm install -g ganache-cli
  - npm install
script:
  - npm test
before_script:
  - testrpc > /dev/null &
  - sleep 5
after_script:
  - npm run coverage && cat coverage/lcov.info | coveralls
```
**NB:** It's best practice to run coverage in a [parallel CI build](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/.travis.yml) rather than assume its equivalence to `truffle test`. Coverage's `testrpc-sc` uses gasLimits far above the current blocklimit and rewrites your contracts in ways that might affect their behavior. It's also less robust than Truffle and may fail more frequently.

**Step 4: Toggle the project on at Travis and Coveralls and push.**

[It should look like this](https://coveralls.io/github/sc-forks/metacoin)

**Appendix: Coveralls vs. Codecov**

[Codecov.io](https://codecov.io/) is another CI coverage provider (we use it for this project). They're very reliable, easy to integrate with and have a nice UI. Unfortunately we haven't found a way to get their reports to show branch coverage. Coveralls has excellent branch coverage reporting out of the box (see below).

![missed_branch](https://user-images.githubusercontent.com/7332026/28502310-6851f79c-6fa4-11e7-8c80-c8fd80808092.png)



### On gas distortion

If you have *hardcoded gas costs* into your tests, some of them may fail when using solidity-coverage.
This is because the instrumentation process increases execution costs by  Using
`estimateGas` to estimate your gas costs or allowing your transactions to use the default gas 
settings should be more resilient in most cases.


### Running out of memory (Locally and in CI)

If your target contains dozens of large contracts, you may run up against node's memory cap during the
contract compilation step. This can be addressed by setting the size of the memory space allocated to the command 
when you run it. (NB: you must use the relative path to the truffle `bin` in node_modules)
```
$ node --max-old-space-size=4096 ../node_modules/.bin/truffle run coverage [options]
```
Note the path: it reaches outside a temporarily generated `coverageEnv` folder to access a locally
installed version of truffle in your root directory's `node_modules`.

Large projects may also hit their CI container memcap running coverage after unit tests. This can be
addressed on TravisCI by adding `sudo: required` to the `travis.yml`, which raises the container's
limit to 7.5MB (ProTip courtesy of [@federicobond](https://github.com/federicobond).

### Running out of time (in mocha)
Truffle sets a default mocha timeout of 5 minutes. Because tests run slower under coverage, it's possible to hit this limit with a test that iterates hundreds of times before producing a result. Timeouts can be disabled by configuring the mocha option in `.solcover.js` as below: (ProTip courtesy of [@cag](https://github.com/cag))

```javascript
module.exports = {
  mocha: {
    enableTimeouts: false
  }
}
```

### On branch coverage

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
