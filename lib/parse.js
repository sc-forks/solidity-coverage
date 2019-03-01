/* eslint no-unused-expressions: ["error", { "allowShortCircuit": true }] */

/**
 * Methods in this file walk the AST and call the instrumenter
 * functions where appropriate, which determine where to inject events.
 * (Listed in alphabetical order)
 */

const parse = {};
const instrumenter = require('./instrumenter');

parse.AssignmentExpression = function parseAssignmentExpression(contract, expression) {
  instrumenter.prePosition(expression);
  instrumenter.instrumentStatement(contract, expression);
  instrumenter.instrumentAssignmentExpression(contract, expression);
};

parse.Block = function parseBlock(contract, expression) {
  for (let x = 0; x < expression.statements.length; x++) {
    instrumenter.instrumentLine(contract, expression.statements[x]);
    parse[expression.statements[x].type] &&
    parse[expression.statements[x].type](contract, expression.statements[x]);
  }
};

parse.BinaryOperation = function parseBinaryOperation(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
}

parse.FunctionCall = function parseCallExpression(contract, expression) {
  // In any given chain of call expressions, only the last one will fail this check. This makes sure
  // we don't instrument a chain of expressions multiple times.
  if (expression.expression.type !== 'FunctionCall') {
    instrumenter.instrumentStatement(contract, expression);
    if (expression.expression.name === 'assert' || expression.expression.name === 'require') {
      instrumenter.instrumentAssertOrRequire(contract, expression);
    }
    parse[expression.expression.type] &&
    parse[expression.expression.type](contract, expression.expression);
  } else {
    parse[expression.expression.type] &&
    parse[expression.expression.type](contract, expression.expression);
  }
};

parse.ConditionalExpression = function parseConditionalExpression(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  instrumenter.instrumentConditionalExpression(contract, expression);
};

parse.ContractDefinition = function ParseContractStatement(contract, expression) {
  parse.ContractOrLibraryStatement(contract, expression);
};

parse.ContractOrLibraryStatement = function parseContractOrLibraryStatement(contract, expression) {
  // From the start of this contract statement, find the first '{', and inject there.
  const injectionPoint = expression.range[0] + contract.instrumented.slice(expression.range[0]).indexOf('{') + 1;
  if (contract.injectionPoints[injectionPoint]) {
    contract.injectionPoints[expression.range[0] + contract.instrumented.slice(expression.range[0]).indexOf('{') + 1].push({
      type: 'eventDefinition',
    });
  } else {
    contract.injectionPoints[expression.range[0] + contract.instrumented.slice(expression.range[0]).indexOf('{') + 1] = [{
      type: 'eventDefinition',
    }];
  }

  if (expression.subNodes) {
    expression.subNodes.forEach(construct => {
      parse[construct.type] &&
      parse[construct.type](contract, construct);
    });
  }
};

parse.EmitStatement = function parseExpressionStatement(contract, expression){
  instrumenter.instrumentStatement(contract, expression);
};

parse.ExpressionStatement = function parseExpressionStatement(contract, content) {
  parse[content.expression.type] &&
  parse[content.expression.type](contract, content.expression);
};

parse.ForStatement = function parseForStatement(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  parse[expression.body.type] &&
  parse[expression.body.type](contract, expression.body);
};

parse.FunctionDefinition = function parseFunctionDefinition(contract, expression) {
  parse.Modifiers(contract, expression.modifiers);
  if (expression.body) {
    instrumenter.instrumentFunctionDeclaration(contract, expression);
    parse[expression.body.type] &&
    parse[expression.body.type](contract, expression.body);
  }
};

parse.IfStatement = function parseIfStatement(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  instrumenter.instrumentIfStatement(contract, expression);
  parse[expression.trueBody.type] &&
  parse[expression.trueBody.type](contract, expression.trueBody);

  if (expression.falseBody) {
    parse[expression.falseBody.type] &&
    parse[expression.falseBody.type](contract, expression.falseBody);
  }
};

parse.InterfaceStatement = function parseInterfaceStatement(contract, expression) {
  parse.ContractOrLibraryStatement(contract, expression);
};

parse.LibraryStatement = function parseLibraryStatement(contract, expression) {
  parse.ContractOrLibraryStatement(contract, expression);
};

parse.MemberExpression = function parseMemberExpression(contract, expression) {
  parse[expression.object.type] &&
  parse[expression.object.type](contract, expression.object);
};

parse.Modifiers = function parseModifier(contract, modifiers) {
  if (modifiers) {
    modifiers.forEach(modifier => {
      parse[modifier.type] && parse[modifier.type](contract, modifier);
    });
  }
};

parse.ModifierDeclaration = function parseModifierDeclaration(contract, expression) {
  instrumenter.instrumentFunctionDeclaration(contract, expression);
  parse[expression.body.type] &&
  parse[expression.body.type](contract, expression.body);
};

parse.NewExpression = function parseNewExpression(contract, expression) {
  parse[expression.typeName.type] &&
  parse[expression.typeName.type](contract, expression.typeName);
};

parse.SourceUnit = function parseSourceUnit(contract, expression) {
  expression.children.forEach(construct => {
    parse[construct.type] &&
    parse[construct.type](contract, construct);
  });
};

parse.ReturnStatement = function parseReturnStatement(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
};

parse.UnaryExpression = function parseUnaryExpression(contract, expression) {
  parse[expression.argument.type] &&
  parse[expression.argument.type](contract, expression.argument);
};

parse.UsingStatement = function parseUsingStatement(contract, expression) {
  parse[expression.for.type] &&
  parse[expression.for.type](contract, expression.for);
};

parse.VariableDeclarationStatement = function parseVariableDeclarationStatement(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  // parse[expression.declarations[0].id.type] &&
  // parse[expression.declarations[0].id.type](contract, expression.declarations[0].id);
};

parse.VariableDeclarationTuple = function parseVariableDeclarationTuple(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  parse[expression.declarations[0].id.type] &&
  parse[expression.declarations[0].id.type](contract, expression.declarations[0].id);
};

parse.WhileStatement = function parseWhileStatement(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  parse[expression.body.type] &&
  parse[expression.body.type](contract, expression.body);
};

module.exports = parse;
