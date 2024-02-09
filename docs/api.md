# Solidity-Coverage API

Solidity-coverage tracks which lines are hit as your tests run by instrumenting the contracts with special solidity statements and detecting their execution in a coverage-enabled EVM.

As such, the API spans the full set of tasks typically required to run a solidity test suite. The
table below shows how its core methods relate to the stages of a test run:

| Test Stage <img width=200/>   | API Method <img width=200/>  | Description <img width=800/>                                                                                                                                                                         |
|---------------|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| compilation   | `instrument` | A **pre-compilation** step: Rewrites contracts and generates an instrumentation data map.                                                                                              |
| client launch |   `attachToHardhatVM`  | A **pre-test** step: Enables coverage collection enabled in a HardhatEVM client. As the client runs it will mark line/branch hits on the instrumentation data map.         |
| test          | `report`     | A **post-test** step: Generates a coverage report from the data collected by the VM after tests complete. |


[3]: https://github.com/gotwarlost/istanbul

**Additional Resources:**

+ the library includes [file system utilities](#Utils) for managing the
disposable set of contracts/artifacts which coverage must use in lieu of the 'real' (uninstrumented)
contracts.

+ a complete [coverage tool/plugin implementation][5] for Hardhat
which can be used as a source if you're building something similar.

+ a [coverage integration for the vitest framework][100] which uses the API written by @wighawag

[5]: https://github.com/sc-forks/solidity-coverage/tree/master/plugins
[100]: https://github.com/wighawag/vitest-solidity-coverage


# Table of Contents

- [API Methods](#api)
  * [constructor](#constructor)
  * [instrument](#instrument)
  * [attachToHardhatVM](#attachToHardhatVM)
  * [report](#report)
  * [getInstrumentationData](#getinstrumentationdata)
  * [setInstrumentationData](#setinstrumentationdata)
- [Utils Methods](#utils)
  * [loadSolcoverJS](#loadsolcoverjs)
  * [assembleFiles](#assemblefiles)
  * [getTempLocations](#gettemplocations)
  * [setupTempFolders](#setuptempfolders)
  * [save](#save)
  * [finish](#finish-1)

# API

**Example**
```javascript
const CoverageAPI = require("solidity-coverage/api");
const api = new CoverageAPI(options);
```

## constructor

Creates a coverage API instance. Configurable.

**Parameters**

-   `options` **Object** : API options

| Option <img width=200/>| Type <img width=200/> | Default <img width=1300/> | Description <img width=800/> |
| ------ | ---- | ------- | ----------- |
| silent | *Boolean* | false | Suppress logging output |
| skipFiles | *Array* | `[]` | Array of contracts or folders (with paths expressed relative to the `contracts` directory) that should be skipped when doing instrumentation. |
| istanbulFolder | *String* | `./coverage` |  Folder location for Istanbul coverage reports. |
| istanbulReporter | *Array* | `['html', 'lcov', 'text', 'json']` | [Istanbul coverage reporters][2]  |

[2]: https://istanbul.js.org/docs/advanced/alternative-reporters/

--------------

## instrument

Instruments a set of sources to prepare them for compilation.

:warning: **Important:** Instrumented sources must be compiled with **solc optimization OFF** :warning:

**Parameters**

-   `contracts` **Object[]**: Array of solidity sources and their paths

Returns **Object[]** in the same format as the `contracts` param, but with sources instrumented.

**Example**
```javascript
const contracts = [{
  source: "contract Simple { uint x = 5; }",
  canonicalPath: "/Users/user/project/contracts/Simple.sol",
  relativePath: "Simple.sol" // Optional, used for pretty printing.
},...]

const instrumented = api.instrument(contracts)
```

--------------

## attachToHardhatVM

Enables coverage data collection on a HardhatEVM provider. (You will need to create a hardhat provider with the correct VM settings as shown below before invoking this method.)

**Parameters**

-   `provider` **Object**: Hardhat provider

Returns **Promise**

**Example**
```javascript
const { createProvider } = require("hardhat/internal/core/providers/construction");
const { resolveConfig } = require("hardhat/internal/core/config/config-resolution");
const { HARDHAT_NETWORK_NAME } = require("hardhat/plugins")

const api = new CoverageAPI( { ... } );

// Execute instrument and compiilation steps and then...

const config = resolveConfig("./", {});

config.networks[HARDHAT_NETWORK_NAME].allowUnlimitedContractSize = true;
config.networks[HARDHAT_NETWORK_NAME].blockGasLimit = api.gasLimitNumber;
config.networks[HARDHAT_NETWORK_NAME].gas =  api.gasLimit;
config.networks[HARDHAT_NETWORK_NAME].gasPrice = api.gasPrice;
config.networks[HARDHAT_NETWORK_NAME].initialBaseFeePerGas = 0;

const provider = await createProvider(
  config,
  HARDHAT_NETWORK_NAME
)

await api.attachToHardhatVM(provider);
```

--------------

## report

Generates coverage report using IstanbulJS

**Parameters**

-   `istanbulFolder` **String**: (*Optional*)   path to folder Istanbul will deposit coverage reports in.

Returns **Promise**

**Example**
```javascript
await api.report('./coverage_4A3cd2b'); // Default folder name is 'coverage'
```

-------------

## getInstrumentationData

Returns a copy of the hit map created during instrumentation. Useful if you'd like to delegate
coverage collection to multiple processes.

Returns **Object** instrumentation data;


**Example**
```javascript
const instrumented = api.instrument(contracts);
const data = api.getInstrumentationData();
save(data); // Pseudo-code
```

-------------

## setInstrumentationData

Sets the hit map object generated during instrumentation. Useful if you'd like
to collect or convert data to coverage for an instrumentation which was generated
in a different process.

**Example**
```javascript
const data = load(data); // Pseudo-code
api.setIntrumentationData(data);

// Client will collect data for the loaded map
await api.attachToHardhatVM(provider);

// Or to `report` instrumentation data which was collected in a different process.
const data = load(data); // Pseudo-code
api.setInstrumentationData(data);

api.report();
```

----------------------------------------------------------------------------------------------------

# Utils

```javascript
const utils = require('solidity-coverage/utils');
```

Many of the utils methods take a `config` object param which
defines the absolute paths to your project root and contracts directory.

**Example**
```javascript
const config = {
  workingDir: process.cwd(),
  contractsDir: path.join(process.cwd(), 'contracts'),
}
```
-------------

## loadSolcoverJS

Loads `.solcoverjs`. Users may specify [options][7] in a `.solcover.js` config file which your
application needs to consume.

**Parameters**

-   `config` **Object**: [See *config* above](#Utils)

Returns **Object** Normalized coverage config


**Example**
```javascript
const solcoverJS = utils.loadSolcoverJS(config);
const api = new CoverageAPI(solcoverJS);
```

[7]: https://github.com/sc-forks/solidity-coverage/tree/master#config-options

-------------

## assembleFiles

Loads contracts from the filesystem in a format that can be passed directly to the
[api.instrument](#instrument) method. Filters by an optional `skipFiles` parameter.

**Parameters**

-   `config` **Object**: [See *config* above](#Utils)
-   `skipFiles` **String[]**: (*Optional*)   Array of files or folders to skip
    [See API *constructor*](#constructor)

Returns **Object** with `targets` and `skipped` keys. These are Object arrays of contract sources
and paths.

**Example**
```javascript
const {
  targets,
  skipped
} = utils.assembleFiles(config, ['Migrations.sol'])

const instrumented = api.instrument(targets);
```

--------------

## getTempLocations

Returns a pair of canonically named temporary directory paths for contracts
and artifacts. Instrumented assets can be compiled from and written to these so the unit tests can
use them as sources.

**Parameters**

-   `config` **Object**: [See *config* above](#Utils)

Returns **Object** with two absolute paths to disposable folders, `tempContractsDir`, `tempArtifactsDir`.
These directories are named `.coverage_contracts` and `.coverage_artifacts`.

**Example**
```javascript
const {
  tempContractsDir,
  tempArtifactsDir
} = utils.getTempLocations(config)

utils.setupTempFolders(config, tempContractsDir, tempArtifactsDir)

// Later, you can call `utils.finish` to delete these...
utils.finish(config, api)
```

----------

## setupTempFolders

Creates temporary directories to store instrumented contracts and their compilation artifacts in.

**Parameters**

-   `config` **Object**: [See *config* above](#Utils)
-   `tempContractsDir` **String**: absolute path to temporary contracts directory
-   `tempArtifactsDir` **String**: absolute path to temporary artifacts directory

**Example**
```javascript
const {
  tempContractsDir,
  tempArtifactsDir
} = utils.getTempLocations(config)

utils.setupTempFolders(config, tempContractsDir, tempArtifactsDir);
```
-------------

## save

Writes an array of instrumented sources in the object format returned by
[api.instrument](#instrument) to a temporary directory.

**Parameters**

-   `contracts` **Object[]**: array of contracts & paths generated by [api.instrument](#instrument)
-   `originalDir` **String**: absolute path to original contracts directory
-   `tempDir` **String**: absolute path to temp contracts directory (the destination of the save)

**Example**
```javascript
const {
  tempContractsDir,
  tempArtifactsDir
} = utils.getTempLocations(config)

utils.setupTempFolders(config, tempContractsDir, tempArtifactsDir);

const instrumented = api.instrument(contracts);

utils.save(instrumented, config.contractsDir, tempContractsDir);
```

-------------

## finish

Deletes temporary folders. Is tolerant - if folders don't exist it will return silently.

**Parameters**

-   `config` **Object**: [See *config* above](#Utils)
-   `api` **Object**: (*Optional*)   coverage api instance whose own `finish` method will be called

Returns **Promise**

**Example**
```javascript
await utils.finish(config, api);
```



