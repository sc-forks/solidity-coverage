# Advanced Use

## Skipping tests

Sometimes there are tests which don't work that well with coverage and it's convenient to skip them.
You can do this by tagging your test descriptions and filtering them out with the mocha options
in .solcover.js:

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

Coverage exposes a set of workflow hooks that let you run arbitrary async logic between the main
stages of the coverage generation process. These are useful for tasks like launching secondary
services which need to connect to coverage's ganache instance (ex: the Oraclize/Provable bridge),
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
+ Tell the testing framework to use the 'modified' artifacts & run tests to completion.
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



