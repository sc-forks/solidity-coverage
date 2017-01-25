const injector = {};

// These functions are used to actually inject the instrumentation events.

injector.callEvent = function injectCallEvent(contract, fileName, injectionPoint) {
  const linecount = (contract.instrumented.slice(0, injectionPoint).match(/\n/g) || []).length + 1;
  contract.runnableLines.push(linecount);
  contract.instrumented = contract.instrumented.slice(0, injectionPoint) +
                          'Coverage(\'' + fileName + '\',' + linecount + ');\n' +
                          contract.instrumented.slice(injectionPoint);
};

injector.callFunctionEvent = function injectCallFunctionEvent(contract, fileName, injectionPoint, injection) {
  contract.instrumented = contract.instrumented.slice(0, injectionPoint) +
    'FunctionCoverage(\'' + fileName + '\',' + injection.fnId + ');\n' +
    contract.instrumented.slice(injectionPoint);
};

injector.callBranchEvent = function injectCallFunctionEvent(contract, fileName, injectionPoint, injection) {
  contract.instrumented = contract.instrumented.slice(0, injectionPoint) +
    (injection.openBracket ? '{' : '') +
    'BranchCoverage(\'' + fileName + '\',' + injection.branchId + ',' + injection.locationIdx + ')' +
    (injection.comma ? ',' : ';') +
    contract.instrumented.slice(injectionPoint);
};

injector.callEmptyBranchEvent = function injectCallEmptyBranchEvent(contract, fileName, injectionPoint, injection) {
  contract.instrumented = contract.instrumented.slice(0, injectionPoint) +
    'else { BranchCoverage(\'' + fileName + '\',' + injection.branchId + ',' + injection.locationIdx + ');}\n' +
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
    ' StatementCoverage(\'' + fileName + '\',' + injection.statementId + ');\n' +
    contract.instrumented.slice(injectionPoint);
};

injector.eventDefinition = function injectEventDefinition(contract, fileName, injectionPoint, injection) {
  contract.instrumented = contract.instrumented.slice(0, injectionPoint) +
    'event Coverage(string fileName, uint256 lineNumber);\n' +
    'event FunctionCoverage(string fileName, uint256 fnId);\n' +
    'event StatementCoverage(string fileName, uint256 statementId);\n' +
    'event BranchCoverage(string fileName, uint256 branchId, uint256 locationIdx);\n' +
     contract.instrumented.slice(injectionPoint);
};


module.exports = injector;
