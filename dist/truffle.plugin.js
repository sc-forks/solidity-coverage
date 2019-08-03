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
  contracts_build_directory, /users/myPath/to/someProject/.coverageArtifacts/contracts
  provider                   ganache.provider (async b/c vm must be resolved)
  logger                     add filter for unused variables...

  Truffle Lib API
  ===============
  load:         const truffle = require("truffle") (or require("sc-truffle"))
  compilation:  await truffle.contracts.compile(config)
  test:         await truffle.test.run(config)
*/

const SolidityCoverage = require('./../lib/app.js');
const req = require('req-cwd');

module.exports = async (config) =>
  let error;

  try {

    // Load truffle lib & coverage config
    const truffle = loadTruffleLibrary();
    const coverageConfig = req.silent('./.solcover.js') || {};

    // Start
    const app = new SolidityCoverage(coverageConfig);

    // Write instrumented sources to temp folder
    app.contractsDirectory = coveragePaths.contracts(config, app);
    app.generateEnvironment(config.contracts_directory, app.contractsDirectory);
    app.instrument();

    // Have truffle use temp folders
    config.contracts_directory = app.contractsDirectory;
    config.build_directory = coveragePaths.artifacts.root(config, app);
    config.contracts_build_directory = coveragePaths.artifacts.contracts(config, app);

    // Compile w/out optimization
    config.compilers.solc.settings.optimization.enabled = false;
    await truffle.contracts.compile(config);

    // Launch provider & run tests
    config.provider = await app.getCoverageProvider(truffle);
    try {
      await truffle.test.run(config)
    } catch (e) {
      error = e;
      app.testsErrored = true;
    }

    // Produce report
    app.generateCoverage();

  } catch(e){
    error = e;
  }

  // Finish
  return app.cleanUp(error);
}

// -------------------------------------- Helpers --------------------------------------------------
function loadTruffleLibrary(){

  try { return require("truffle") }   catch(err) {};
  try { return require("./truffle.library")} catch(err) {};

  throw new Error(utils.errors.NO_TRUFFLE_LIB)
}

const coveragePaths = {
  contracts: (t, c) => path.join(path.dirname(t.contracts_directory), c.contractsDirName)),

  artifacts: {
    root:      (t, c) => path.join(path.dirname(t.build_directory), c.artifactsDirName),
    contracts: (t, c) => {
      const root = path.join(path.dirname(t.build_directory), c.artifactsDirName);
      return path.join(root, path.basename(t.contracts_build_directory));
    }
  }
}


