const injector = {};

// These functions are used to actually inject the instrumentation events.

injector.callEvent = function injectCallEvent(contract, fileName, injectionPoint) {
  const linecount = (contract.instrumented.slice(0, injectionPoint).match(/\n/g) || []).length + 1;
  contract.runnableLines.push(linecount);
  contract.instrumented = contract.instrumented.slice(0, injectionPoint) +
                          'emit __Coverage' + contract.contractName + '(\'' + fileName + '\',' + linecount + ');\n' +
                          contract.instrumented.slice(injectionPoint);
};

injector.callFunctionEvent = function injectCallFunctionEvent(contract, fileName, injectionPoint, injection) {
  contract.instrumented = contract.instrumented.slice(0, injectionPoint) +
    'emit __FunctionCoverage' + contract.contractName + '(\'' + fileName + '\',' + injection.fnId + ');\n' +
    contract.instrumented.slice(injectionPoint);
};

injector.callBranchEvent = function injectCallFunctionEvent(contract, fileName, injectionPoint, injection) {
  contract.instrumented = contract.instrumented.slice(0, injectionPoint) +
    (injection.openBracket ? '{' : '') +
    'emit __BranchCoverage' + contract.contractName + '(\'' + fileName + '\',' + injection.branchId + ',' + injection.locationIdx + ')' +
    (injection.comma ? ',' : ';') +
    contract.instrumented.slice(injectionPoint);
};

injector.callEmptyBranchEvent = function injectCallEmptyBranchEvent(contract, fileName, injectionPoint, injection) {
  contract.instrumented = contract.instrumented.slice(0, injectionPoint) +
    'else { emit __BranchCoverage' + contract.contractName + '(\'' + fileName + '\',' + injection.branchId + ',' + injection.locationIdx + ');}\n' +
    contract.instrumented.slice(injectionPoint);
};


injector.callAssertPreEvent = function callAssertPreEvent(contract, fileName, injectionPoint, injection) {
  contract.instrumented = contract.instrumented.slice(0, injectionPoint) +
  'emit __AssertPreCoverage' + contract.contractName + '(\'' + fileName + '\',' + injection.branchId + ');\n' +
  contract.instrumented.slice(injectionPoint);
};

injector.callAssertPostEvent = function callAssertPostEvent(contract, fileName, injectionPoint, injection) {
  contract.instrumented = contract.instrumented.slice(0, injectionPoint) +
  'emit __AssertPostCoverage' + contract.contractName + '(\'' + fileName + '\',' + injection.branchId + ');\n' +
  contract.instrumented.slice(injectionPoint);
};

injector.openParen = function injectOpenParen(contract, fileName, injectionPoint, injection) {
  contract.instrumented = contract.instrumented.slice(0, injectionPoint) + '(' + contract.instrumented.slice(injectionPoint);
};

injector.closeParen = function injectCloseParen(contract, fileName, injectionPoint, injection) {
  contract.instrumented = contract.instrumented.slice(0, injectionPoint) + ')' + contract.instrumented.slice(injectionPoint);
};

injector.literal = function injectLiteral(contract, fileName, injectionPoint, injection) {
  contract.instrumented = contract.instrumented.slice(0, injectionPoint) + injection.string + contract.instrumented.slice(injectionPoint);
};

injector.statement = function injectStatement(contract, fileName, injectionPoint, injection) {
  contract.instrumented = contract.instrumented.slice(0, injectionPoint) +
    'emit __StatementCoverage' + contract.contractName + '(\'' + fileName + '\',' + injection.statementId + ');\n' +
    contract.instrumented.slice(injectionPoint);
};

injector.eventDefinition = function injectEventDefinition(contract, fileName, injectionPoint, injection) {
  contract.instrumented = contract.instrumented.slice(0, injectionPoint) +
    'event __Coverage' + contract.contractName + '(string fileName, uint256 lineNumber);\n' +
    'event __FunctionCoverage' + contract.contractName + '(string fileName, uint256 fnId);\n' +
    'event __StatementCoverage' + contract.contractName + '(string fileName, uint256 statementId);\n' +
    'event __BranchCoverage' + contract.contractName + '(string fileName, uint256 branchId, uint256 locationIdx);\n' +
    'event __AssertPreCoverage' + contract.contractName + '(string fileName, uint256 branchId);\n' +
    'event __AssertPostCoverage' + contract.contractName + '(string fileName, uint256 branchId);\n' +

     contract.instrumented.slice(injectionPoint);
};


module.exports = injector;
