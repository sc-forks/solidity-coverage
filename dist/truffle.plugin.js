/*
  TruffleConfig Paths
  ===========================
  build_directory            /users/myPath/to/someProject/build
  contracts_directory.       /users/myPath/to/someProject/contracts
  working_directory          /users/myPath/to/someProject
  contracts_build_directory  /users/myPath/to/someProject/build/contracts

  Compilation options override
  ----------------------------
  build_directory            /users/myPath/to/someProject/.coverageArtifacts
  contracts_directory        /users/myPath/to/someProject/.coverageContracts

  Test options override
  ---------------------
  contracts_directory,       /users/myPath/to/someProject/.coverageContracts
  contracts_build_directory, /users/myPath/to/someProject/.coverageArtifact/contracts
  provider                   ganache.provider (w/ vm resolved)
  logger                     add filter for unused variables...

  Truffle Lib API
  ===============
  load:         const truffle = require("truffle") (or require("sc-truffle"))
  compilation:  await truffle.contracts.compile(config)
  test:         await truffle.test.run(config)
*/

const SolidityCoverage = require('./../lib/app.js');

module.exports = async (config) =>
  let truffle;

  try {
    truffle = loadTruffleLibrary();

    const coverageConfigPath = coveragePaths.config(config)
    const coverageConfig = req.silent(coverageConfigPath) || {};

    app.contractsDir = coveragePaths.contracts(config, coverageConfig);

    const app = new SolidityCoverage(coverageConfig);
    app.generateEnvironment();
    app.instrument(config.contracts_directory);

    // Compile instrumented sources / optimization off
    config.contracts_directory = app.contractsDir;
    config.build_directory = coveragePaths.artifacts.root(config, coverageConfig);
    config.contracts_build_directory = coveragePaths.artifacts.contracts(config, coverageConfig);
    config.compilers.solc.settings.optimization.enabled = false;
    await truffle.contracts.compile(config);

    // Test using compiled, instrumented sources
    config.provider = await app.getCoverageProvider();
    try {
      await truffle.test.run(config)
    } catch (err) {
      app.testsErrored = true;
    }

    app.generateCoverage();

  } catch(err){
    return app.cleanUp(err);
  }

  return app.cleanUp();
}

// -------------------------------------- Helpers --------------------------------------------------
function loadTruffleLibrary(){

  try { return require("truffle") }   catch(err) {};
  try { return require("sc-truffle")} catch(err) {};

  throw new Error(utils.errors.NO_TRUFFLE_LIB)
}

const coveragePaths = {
  contracts: (t, c) =>     path.join(path.dirname(t.contracts_directory), c.contractsDirName)),
  config:    (t)    =>     path.join(t.working_directory, '.solcover.js'),

  artifacts: {
    root:      (t, c)   => path.join(path.dirname(t.build_directory), c.artifactsDirName),
    contracts: (c, t) => path.join(c.build_directory, path.basename(t.contracts_build_directory))
  }
}


