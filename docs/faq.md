# FAQ

### Continuous Integration: installing Metacoin on TravisCI with Coveralls


**Step 1: Create a metacoin project & install coverage tools**

```bash
$ truffle init

# Install coverage dependencies
$ npm init
$ npm install --save-dev coveralls
$ npm install --save-dev solidity-coverage
```

**Step 2: Add test and coverage scripts to the `package.json`:**

```javascript
"scripts": {
    "test": "truffle test",
    "coverage": "./node_modules/.bin/solidity-coverage"
},
```

**Step 3: Create a .travis.yml:**

```yml
sudo: required
dist: trusty
language: node_js
node_js:
  - '7'
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
**NB:** It's probably best practice to run coverage in CI as an `after_script` or in a [parallel build](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/.travis.yml) rather than assume its equivalence to `truffle test`. Solidity-coverage's `testrpc` uses gasLimits far above the current blocklimit and rewrites your contracts in ways that might affect their behavior. It's also less robust than Truffle and may fail more frequently.

**Step 4: Toggle the project on at Travis and Coveralls and push.**

[It should look like this](https://coveralls.io/github/sc-forks/metacoin)

**Appendix: Coveralls vs. Codecov**

[Codecov.io](https://codecov.io/) is another CI coverage provider (we use it for this project). They're very reliable, easy to integrate with and have a nice UI. Unfortunately we haven't found a way to get their reports to show branch coverage. Coveralls has excellent branch coverage reporting out of the box (see below).

![missed_branch](https://user-images.githubusercontent.com/7332026/28502310-6851f79c-6fa4-11e7-8c80-c8fd80808092.png)




### Running out of gas
If you have hardcoded gas costs into your tests some of them may fail when using solidity-coverage.
This is because the instrumentation process increases the gas costs for using the contracts, due to
the extra events. If this is the case, then the coverage may be incomplete. To avoid this, using
`estimateGas` to estimate your gas costs should be more resilient in most cases.

**Example:**
```javascript
// Hardcoded Gas Call
MyContract.deployed().then(instance => {
  instance.claimTokens(0, {gasLimit: 3000000}).then(() => {
      assert(web3.eth.getBalance(instance.address).equals(new BigNumber('0')))
      done();
  })
});

// Using gas estimation
MyContract.deployed().then(instance => {
  const data = instance.contract.claimTokens.getData(0);
  const gasEstimate = web3.eth.estimateGas({to: instance.address, data: data});
  instance.claimTokens(0, {gasLimit: gasEstimate}).then(() => {
      assert(web3.eth.getBalance(instance.address).equals(new BigNumber('0')))
      done();
  })
});
```

### Running out of memory (Locally and in CI)
(See [issue #59](https://github.com/sc-forks/solidity-coverage/issues/59)).
If your target contains dozens of contracts, you may run up against node's 1.7MB memory cap during the
contract compilation step. This can be addressed by setting the `testCommand` option in `.solcover.js` as
below:
```javascript
testCommand: 'node --max-old-space-size=4096 ../node_modules/.bin/truffle test --network coverage'
```
Note the path: it reaches outside a temporarily generated `coverageEnv` folder to access a locally
installed version of truffle in your root directory's `node_modules`.

Large projects may also hit their CI container memcap running coverage after unit tests. This can be
addressed on TravisCI by adding `sudo: required` to the `travis.yml`, which raises the container's
limit to 7.5MB (ProTip courtesy of [@federicobond](https://github.com/federicobond).

### Running out of time (in mocha)
Truffle sets a default mocha timeout of 5 minutes. Because tests run slower under coverage, it's possible to hit this limit with a test that iterates hundreds of times before producing a result. Timeouts can be disabled by configuring the mocha option in `truffle.js` as below: (ProTip courtesy of [@cag](https://github.com/cag))
```javascript
module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*"
        },
        ...etc...
    },
    mocha: {
        enableTimeouts: false
    }
}
```

### Using alongside HDWalletProvider
[See Truffle issue #348](https://github.com/trufflesuite/truffle/issues/348).
HDWalletProvider crashes solidity-coverage, so its constructor shouldn't be invoked while running this tool.
One way around this is to instantiate the HDWallet conditionally in `truffle.js`:

```javascript
var HDWalletProvider = require('truffle-hdwallet-provider');
var mnemonic = 'bark moss walnuts earth flames felt grateful dead sophia loren';

if (!process.env.SOLIDITY_COVERAGE){
  provider = new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/')
}

module.exports = {
  networks:
    ropsten: {
      provider: provider,
      network_id: 3
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,
      ...etc..
    }
    ...etc...
```

And set up an npm script to run the coverage tool like this:
```javascript
"scripts": {
    "coverage": "SOLIDITY_COVERAGE=true ./node_modules/.bin/solidity-coverage"
},
```

### Why has my branch coverage decreased? Why is assert being shown as a branch point?

`assert` and `require` check whether a condition is true or not. If it is, they allow execution to proceed. If not, they throw, and all changes are reverted. Indeed, prior to [Solidity 0.4.10](https://github.com/ethereum/solidity/releases/tag/v0.4.10), when `assert` and `require` were introduced, this functionality was achieved by code that looked like

```
if (!x) throw;
```
rather than

```
require(x)
```

Clearly, the coverage should be the same in these situations, as the code is (functionally) identical. Older versions of solidity-coverage did not treat these as branch points, and they were not considered in the branch coverage filter. Newer versions *do* count these as branch points, so if your tests did not include failure scenarios for `assert` or `require`, you may see a decrease in your coverage figures when upgrading `solidity-coverage`.

If an `assert` or `require` is marked with an `I` in the coverage report, then during your tests the conditional is never true. If it is marked with an `E`, then it is never false.

### Why are send and transfer throwing?

If you include contracts that have fallback function in the list of files to instrument and attempt to `send` or `transfer` to them,
the methods will throw because the instrumentation consumes more gas than these methods allow. See the `skipFiles` option in the
README to exclude these files and [issue 118](https://github.com/sc-forks/solidity-coverage/issues/118) for a more detailed discussion of
this problem.

### Running on windows

Since `v0.2.6` it's possible to produce a report on Windows (thanks to [@phiferd](https://github.com/phiferd),
who also maintains their own windows-compatible fork of solidity-coverage with other useful improvements). However,
problems remain with the tool's internal launch of `testrpc-sc` so you should create a `.solcover.js` config
file in your root directory and set the `norpc` option to `true`. Then follow the directions below for
launching `testrpc-sc` on its own from the command line before running `solidity-coverage` itself.

### Running testrpc-sc on its own

Sometimes its useful to launch `testrpc-sc` separately at the command line or with a script, after
setting the `norpc` config option in `.solcover.js` to true:

If you installed using npm
```
$ ./node_modules/.bin/testrpc-sc <options>
```

If you installed using yarn
```
$ ./node_modules/ethereumjs-testrpc-sc/bin/testrpc        // v0.1.10 and below (testrpc v3.0.3)
$ ./node_modules/ethereumjs-testrpc-sc/build/cli.node.js  // All others (testrpc v4.0.1 +)
```

### Running truffle as a local dependency

If your project ships with Truffle as a dev dependency and expects that instance to be
invoked when running tests, you should either set the `copyNodeModules` option to `true`
in your`.solcover.js` config file OR (if doing so results in poor run time performance), set
the config's `testCommand` and `compileCommand` options as below:

```javascript
compileCommand: '../node_modules/.bin/truffle compile',
testCommand: '../node_modules/.bin/truffle test --network coverage',
```






