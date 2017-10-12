const SolidityParser = require('solidity-parser-sc');
const preprocessor = require('./preprocessor');
const injector = require('./injector');
const parse = require('./parse');

const path = require('path');

module.exports = function instrumentSolidity(contractSource, fileName) {
  const contract = {};
  contract.source = contractSource;
  contract.instrumented = contractSource;

  contract.runnableLines = [];
  contract.fnMap = {};
  contract.fnId = 0;
  contract.branchMap = {};
  contract.branchId = 0;
  contract.statementMap = {};
  contract.statementId = 0;
  contract.injectionPoints = {};

  // First, we run over the original contract to get the source mapping.
  let ast = SolidityParser.parse(contract.source);
  parse[ast.type](contract, ast);
  const retValue = JSON.parse(JSON.stringify(contract));

  // Now, we reset almost everything and use the preprocessor first to increase our effectiveness.
  contract.runnableLines = [];
  contract.fnMap = {};
  contract.fnId = 0;
  contract.branchMap = {};
  contract.branchId = 0;
  contract.statementMap = {};
  contract.statementId = 0;
  contract.injectionPoints = {};

  contract.preprocessed = preprocessor.run(contract.source);
  contract.instrumented = contract.preprocessed;

  ast = SolidityParser.parse(contract.preprocessed);

  const contractStatement = ast.body.filter(node => (node.type === 'ContractStatement' ||
                                                     node.type === 'LibraryStatement'));
  contract.contractName = contractStatement[0].name;

  parse[ast.type](contract, ast);

  // We have to iterate through these injection points in descending order to not mess up
  // the injection process.
  const sortedPoints = Object.keys(contract.injectionPoints).sort((a, b) => b - a);
  sortedPoints.forEach(injectionPoint => {
    // Line instrumentation has to happen first
    contract.injectionPoints[injectionPoint].sort((a, b) => {
      const eventTypes = ['openParen', 'callBranchEvent', 'callEmptyBranchEvent', 'callEvent'];
      return eventTypes.indexOf(b.type) - eventTypes.indexOf(a.type);
    });
    contract.injectionPoints[injectionPoint].forEach(injection => {
      injector[injection.type](contract, fileName, injectionPoint, injection);
    });
  });
  retValue.runnableLines = contract.runnableLines;
  retValue.contract = contract.instrumented;
  retValue.contractName = contractStatement[0].name;

  return retValue;
};
