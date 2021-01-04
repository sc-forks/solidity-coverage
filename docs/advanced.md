# Advanced Use

## Skipping tests

Sometimes it's convenient to skip specific tests when running coverage. You can do this by
tagging your test descriptions and setting appropriate filters in the `.solcover.js` mocha options.

**Example**
```javascript
// Mocha test to skip
it("is a gas usage simulation [ @skip-on-coverage ]", async function(){
 ...
})
```

```javascript
//.solcover.js
module.exports = {
  mocha: {
    grep: "@skip-on-coverage", // Find everything with this tag
    invert: true               // Run the grep's inverse set.
  }
}
```

## Workflow hooks

The plugin exposes a set of workflow hooks that let you run arbitrary async logic between the main
stages of the coverage generation process. These are useful for tasks like launching secondary
services which need to connect to a running ganache instance (ex: the Oraclize/Provable bridge),
or reading data from the compilation artifacts to run special preparatory steps for your tests.

The stages/hooks are (in order of execution):

| Stage                                  | Post-stage hook    |
|----------------------------------------|--------------------|
| Launch server                          | onServerReady      |
| Instrument and compile contracts       | onCompileComplete  |
| Run tests using instrumented artifacts | onTestsComplete    |
| Generate istanbul coverage reports     | onIstanbulComplete |

The tool's general workflow is:

+ Launch an ethereum client, attaching special listeners that monitor each opcode execution step
+ Read Solidity contract sources from a standard contracts directory
+ Rewrite the sources so the code execution path can be tracked by the opcode monitors.
+ Compile the modified sources, without optimization
+ Save the compilation artifacts to a temporary folder
+ Tell the testing framework to use the instrumented artifacts & run tests to completion.
+ Transfer collected data to a coverage reporter & report.

Each hook is passed a `config` object provided by your plugin's dev platform which will contain
relevant source/artifact paths and network info for that stage.

**Example**

```javascript
// .solcover.js
const { provableBridge } = require('./helpers');

async function serverReadyHandler(config){
  await provableBridge(config.port);
}

module.exports = {
  onServerReady: serverReadyHandler,
}
```

## Setting the temporary artifacts directory

The `temp` command line option lets you to specify the name of a disposable folder to
stage the compilation artifacts of instrumented contracts in before the tests are run.

**Example**
```
$ truffle run coverage --temp build
```

By default this folder is called `.coverage_artifacts`. If you already have
preparatory scripts which run between compilation and the tests, you'll probably
find it inconvenient to modify them to handle an alternate path.

This option allows you to avoid that but it's important to realise that the temp
folder is **automatically deleted** when coverage completes. You shouldn't use it if your preferred
build target contains information you want to preserve between test runs.

## Reducing the instrumentation footprint

If your project is very large or if you have logic that's gas sensitive, it can be useful to
minimize the amount of instrumentation the coverage tool adds to your Solidity code.

Usually you're only interested in line and branch coverage but Istanbul also collects data for individual
statements and "functions" (e.g - whether every declared function has been called).

Setting the `measureStatementCoverage` and/or `measureFunctionCoverage` options to `false` can
improve performance, lower the cost of execution and minimize complications that arise from `solc`'s
limits on how large the compilation payload can be.

## Generating a test matrix

Some advanced testing strategies benefit from knowing which tests in a suite hit a
specific line of code. Examples include:
+ [mutation testing][22], where this data lets you select the correct subset of tests to check
a mutation with.
+ [fault localization techniques][23], where the complete data set is a key input to algorithms that try
to guess where bugs might exist in a given codebase.

Running the coverage command with `--matrix` will write [a JSON test matrix][25] which maps greppable
test names to each line of code to a file named `testMatrix.json` in your project's root.

[22]: https://github.com/JoranHonig/vertigo#vertigo
[23]: http://spideruci.org/papers/jones05.pdf
[25]: https://github.com/sc-forks/solidity-coverage/blob/master/docs/matrix.md
