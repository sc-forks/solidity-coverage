/**
 * Methods in this file walk the AST and call the instrumenter
 * functions where appropriate, which determine where to inject events.
 * (Listed in alphabetical order)
 */
const semver = require('semver');
const Registrar = require('./registrar');
const register = new Registrar();

const FILE_SCOPED_ID = "fileScopedId";
const parse = {};

// Utilities
parse.configureStatementCoverage = function(val){
  register.measureStatementCoverage = val;
}

parse.configureFunctionCoverage = function(val){
  register.measureFunctionCoverage = val;
}

// Nodes
parse.AssignmentExpression = function(contract, expression) {
  register.statement(contract, expression);
};

parse.Block = function(contract, expression) {
  for (let x = 0; x < expression.statements.length; x++) {
    register.line(contract, expression.statements[x]);
    parse[expression.statements[x].type] &&
    parse[expression.statements[x].type](contract, expression.statements[x]);
  }
};

parse.BinaryOperation = function(contract, expression) {
  register.statement(contract, expression);
}

parse.FunctionCall = function(contract, expression) {
  // In any given chain of call expressions, only the last one will fail this check.
  // This makes sure we don't instrument a chain of expressions multiple times.
  if (expression.expression.type !== 'FunctionCall') {
    register.statement(contract, expression);
    if (expression.expression.name === 'require') {
      register.requireBranch(contract, expression);
    }
    parse[expression.expression.type] &&
    parse[expression.expression.type](contract, expression.expression);
  } else {
    parse[expression.expression.type] &&
    parse[expression.expression.type](contract, expression.expression);
  }
};

parse.Conditional = function(contract, expression) {
  register.statement(contract, expression);
  // TODO: Investigate node structure
  // There are potential substatements here we aren't measuring
};

parse.ContractDefinition = function(contract, expression) {
  parse.ContractOrLibraryStatement(contract, expression);
};

parse.ContractOrLibraryStatement = function(contract, expression) {

  // We need to define a method to pass coverage hashes into at top of each contract.
  // This lets us get a fresh stack for the hash and avoid stack-too-deep errors.
  if (expression.kind !== 'interface'){
    let start = 0;

    // It's possible a base contract will have constructor string arg
    // which contains an open curly brace. Skip ahead pass the bases...
    if (expression.baseContracts && expression.baseContracts.length){
      for (let base of expression.baseContracts ){
        if (base.range[1] > start){
          start = base.range[1];
        }
      }
    } else {
      start = expression.range[0];
    }

    const end = contract.instrumented.slice(start).indexOf('{') + 1;
    const loc = start + end;;

    contract.contractName = expression.name;

    (contract.injectionPoints[loc])
      ? contract.injectionPoints[loc].push({ type: 'injectHashMethod', contractName: expression.name})
      : contract.injectionPoints[loc] = [{ type: 'injectHashMethod', contractName: expression.name}];
  }

  if (expression.subNodes) {
    // Set flag to allow alternate cov id generation of file-level fn defs
    contract.isContractScoped = true;
    expression.subNodes.forEach(construct => {
      parse[construct.type] &&
      parse[construct.type](contract, construct);
    });
    // Unset flag...
    contract.isContractScoped = false;
  }
};

parse.EmitStatement = function(contract, expression){
  register.statement(contract, expression);
};

parse.ExpressionStatement = function(contract, content) {
  parse[content.expression.type] &&
  parse[content.expression.type](contract, content.expression);
};

parse.ForStatement = function(contract, expression) {
  register.statement(contract, expression);
  parse[expression.body.type] &&
  parse[expression.body.type](contract, expression.body);
};

parse.FunctionDefinition = function(contract, expression) {
  // Use generic name component to generate the hash for cov fn ids
  // if we're not inside a contract
  let tempContractName = contract.contractName;
  if (!contract.isContractScoped){
    contract.contractName = FILE_SCOPED_ID;
  }

  parse.Modifiers(contract, expression.modifiers);
  if (expression.body) {
    // Skip fn & statement instrumentation for `receive` methods to
    // minimize gas distortion
    (expression.name === null && expression.isReceiveEther)
      ? register.trackStatements = false
      : register.functionDeclaration(contract, expression);

    parse[expression.body.type] &&
    parse[expression.body.type](contract, expression.body);
    register.trackStatements = true;
  }
  // Reset contractName in case it was changed for file scoped methods
  contract.contractName = tempContractName;
};

parse.IfStatement = function(contract, expression) {
  register.statement(contract, expression);
  register.ifStatement(contract, expression);
  parse[expression.trueBody.type] &&
  parse[expression.trueBody.type](contract, expression.trueBody);

  if (expression.falseBody) {
    parse[expression.falseBody.type] &&
    parse[expression.falseBody.type](contract, expression.falseBody);
  }
};

// TODO: Investigate Node structure
/*parse.MemberAccess = function(contract, expression) {
  parse[expression.object.type] &&
  parse[expression.object.type](contract, expression.object);
};*/

parse.Modifiers = function(contract, modifiers) {
  if (modifiers) {
    modifiers.forEach(modifier => {
      parse[modifier.type] && parse[modifier.type](contract, modifier);
    });
  }
};

parse.ModifierDefinition = function(contract, expression) {
  register.functionDeclaration(contract, expression);
  parse[expression.body.type] &&
  parse[expression.body.type](contract, expression.body);
};

parse.NewExpression = function(contract, expression) {
  parse[expression.typeName.type] &&
  parse[expression.typeName.type](contract, expression.typeName);
};

parse.PragmaDirective = function(contract, expression){
  let minVersion;

  // Some solidity pragmas crash semver (ex: ABIEncoderV2)
  try {
    minVersion = semver.minVersion(expression.value);
  } catch(e){
    return;
  }

  // pragma abicoder v2 passes the semver test above but needs to be ignored
  if (expression.name === 'abicoder'){
    return
  }

  // From solc >=0.7.4, every file should have instrumentation methods
  // defined at the file level which file scoped fns can use...
  if (semver.lt("0.7.3", minVersion)){
    const start = expression.range[0];
    const end = contract.instrumented.slice(start).indexOf(';') + 1;
    const loc = start + end;

    const injectionObject = {
      type: 'injectHashMethod',
      contractName: FILE_SCOPED_ID,
      isFileScoped: true
    };

    contract.injectionPoints[loc] = [injectionObject];
  }
}

parse.SourceUnit = function(contract, expression) {
  expression.children.forEach(construct => {
    parse[construct.type] &&
    parse[construct.type](contract, construct);
  });
};

parse.ReturnStatement = function(contract, expression) {
  register.statement(contract, expression);
};

// TODO:Investigate node structure
/*parse.UnaryOperation = function(contract, expression) {
  parse[subExpression.argument.type] &&
  parse[subExpression.argument.type](contract, expression.argument);
};*/

parse.TryStatement = function(contract, expression) {
  register.statement(contract, expression);
  parse[expression.body.type] &&
  parse[expression.body.type](contract, expression.body);

  for (let x = 0; x < expression.catchClauses.length; x++) {
    parse[expression.catchClauses[x].body.type] &&
    parse[expression.catchClauses[x].body.type](contract, expression.catchClauses[x].body);
  }
};

parse.UsingStatement = function (contract, expression) {
  parse[expression.for.type] &&
  parse[expression.for.type](contract, expression.for);
};

parse.VariableDeclarationStatement = function (contract, expression) {
  register.statement(contract, expression);
};

parse.WhileStatement = function (contract, expression) {
  register.statement(contract, expression);
  parse[expression.body.type] &&
  parse[expression.body.type](contract, expression.body);
};

module.exports = parse;
