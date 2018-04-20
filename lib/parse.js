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

parse.BlockStatement = function parseBlockStatement(contract, expression) {
  for (let x = 0; x < expression.body.length; x++) {
    instrumenter.instrumentLine(contract, expression.body[x]);
    parse[expression.body[x].type] &&
    parse[expression.body[x].type](contract, expression.body[x]);
  }
};

parse.CallExpression = function parseCallExpression(contract, expression) {
  // In any given chain of call expressions, only the head callee is an Identifier node
  if (expression.callee.type === 'Identifier') {
    instrumenter.instrumentStatement(contract, expression);
    if (expression.callee.name === 'assert' || expression.callee.name === 'require') {
      instrumenter.instrumentAssertOrRequire(contract, expression);
    }
    parse[expression.callee.type] &&
    parse[expression.callee.type](contract, expression.callee);
  } else {
    parse[expression.callee.type] &&
    parse[expression.callee.type](contract, expression.callee);
  }
};

parse.ConditionalExpression = function parseConditionalExpression(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  instrumenter.instrumentConditionalExpression(contract, expression);
};

parse.ContractStatement = function ParseContractStatement(contract, expression) {
  parse.ContractOrLibraryStatement(contract, expression);
};

parse.ContractOrLibraryStatement = function parseContractOrLibraryStatement(contract, expression) {
  // From the start of this contract statement, find the first '{', and inject there.
  const injectionPoint = expression.start + contract.instrumented.slice(expression.start).indexOf('{') + 1;
  if (contract.injectionPoints[injectionPoint]) {
    contract.injectionPoints[expression.start + contract.instrumented.slice(expression.start).indexOf('{') + 1].push({
      type: 'eventDefinition',
    });
  } else {
    contract.injectionPoints[expression.start + contract.instrumented.slice(expression.start).indexOf('{') + 1] = [{
      type: 'eventDefinition',
    }];
  }

  if (expression.body) {
    expression.body.forEach(construct => {
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

parse.FunctionDeclaration = function parseFunctionDeclaration(contract, expression) {
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

  parse[expression.consequent.type] &&
  parse[expression.consequent.type](contract, expression.consequent);

  if (expression.alternate) {
    parse[expression.alternate.type] &&
    parse[expression.alternate.type](contract, expression.alternate);
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
  parse[expression.callee.type] &&
  parse[expression.callee.type](contract, expression.callee);
};

parse.Program = function parseProgram(contract, expression) {
  expression.body.forEach(construct => {
    parse[construct.type] &&
    parse[construct.type](contract, construct);
  });
};

parse.ReturnStatement = function parseReturnStatement(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
};

parse.ThrowStatement = function parseThrowStatement(contract, expression) {
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

parse.VariableDeclaration = function parseVariableDeclaration(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  parse[expression.declarations[0].id.type] &&
  parse[expression.declarations[0].id.type](contract, expression.declarations[0].id);
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
