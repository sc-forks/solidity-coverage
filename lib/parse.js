/* eslint no-unused-expressions: ["error", { "allowShortCircuit": true }] */

/**
 * Methods in this file walk the AST and call the instrumenter
 * functions where appropriate, which determine where to inject events.
 * (Listed in alphabetical order)
 */

const instrumenter = require('./instrumenter');

const parse = {};
const REQUIRE = 'require';
const ASSERT = 'assert';
const IDENTIFIER = 'Identifier';
const EVENT_DEF = { type: 'eventDefinition' };
const LEFT_BRACE = '{';

const doParse = (contract, part) => {
  parse[part.type] && parse[part.type](contract, part);
};

parse.AssignmentExpression = function parseAssignmentExpression(contract, expression) {
  instrumenter.prePosition(expression);
  instrumenter.instrumentStatement(contract, expression);
  instrumenter.instrumentAssignmentExpression(contract, expression);
};

parse.BlockStatement = function parseBlockStatement(contract, { body }) {
  body.forEach(construct => {
    instrumenter.instrumentLine(contract, construct);
    doParse(contract, construct);
  });
};

parse.CallExpression = function parseCallExpression(contract, expression) {
  // In any given chain of call expressions, only the head callee is an Identifier node
  const { callee } = expression;
  const { name, type } = callee;

  if (type === IDENTIFIER) {
    instrumenter.instrumentStatement(contract, expression);
    if (name === ASSERT || name === REQUIRE) {
      instrumenter.instrumentAssertOrRequire(contract, expression);
    }
  }
  doParse(contract, callee);
};

parse.ConditionalExpression = function parseConditionalExpression(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  instrumenter.instrumentConditionalExpression(contract, expression);
};

parse.ContractStatement = function ParseContractStatement(contract, expression) {
  parse.ContractOrLibraryStatement(contract, expression);
};

parse.ContractOrLibraryStatement = function parseContractOrLibraryStatement(contract, { start, body }) {
  // From the start of this contract statement, find the first '{', and inject there.
  const { instrumented, injectionPoints } = contract;
  const injectionPoint = start + instrumented.slice(start).indexOf(LEFT_BRACE) + 1;

  if (injectionPoints[injectionPoint]) {
    injectionPoints[injectionPoint].push(EVENT_DEF);
  } else {
    injectionPoints[injectionPoint] = [EVENT_DEF];
  }

  if (body) {
    body.forEach(construct => {
      doParse(contract, construct);
    });
  }
};

parse.ExpressionStatement = function parseExpressionStatement(contract, { expression }) {
  doParse(contract, expression);
};

parse.ForStatement = function parseForStatement(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  const { body } = expression;
  doParse(contract, body);
};

parse.FunctionDeclaration = function parseFunctionDeclaration(contract, expression) {
  const { modifiers, body } = expression;

  parse.Modifiers(contract, modifiers);
  if (body) {
    instrumenter.instrumentFunctionDeclaration(contract, expression);
    doParse(contract, body);
  }
};

parse.IfStatement = function parseIfStatement(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  instrumenter.instrumentIfStatement(contract, expression);
  const { consequent, alternate } = expression;
  doParse(contract, consequent);
  if (alternate) doParse(contract, alternate);
};

parse.LibraryStatement = function parseLibraryStatement(contract, expression) {
  parse.ContractOrLibraryStatement(contract, expression);
};

parse.MemberExpression = function parseMemberExpression(contract, { object }) {
  doParse(contract, object);
};

parse.Modifiers = function parseModifier(contract, modifiers) {
  if (modifiers) {
    modifiers.forEach(modifier => {
      doParse(contract, modifier);
    });
  }
};

parse.ModifierDeclaration = function parseModifierDeclaration(contract, expression) {
  instrumenter.instrumentFunctionDeclaration(contract, expression);
  const { body } = expression;
  doParse(contract, body);
};

parse.NewExpression = function parseNewExpression(contract, { callee }) {
  doParse(contract, callee);
};

parse.Program = function parseProgram(contract, { body }) {
  body.forEach(construct => {
    doParse(contract, construct);
  });
};

parse.ReturnStatement = function parseReturnStatement(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
};

parse.ThrowStatement = function parseThrowStatement(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
};

parse.UnaryExpression = function parseUnaryExpression(contract, { argument }) {
  parse[argument.type] && parse[argument.type](contract, argument);
};

parse.UsingStatement = function parseUsingStatement(contract, { for: xfor }) {
  doParse(contract, xfor);
};

parse.VariableDeclaration = function parseVariableDeclaration(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  const { id } = expression.declarations[0];
  doParse(contract, id);
};

parse.VariableDeclarationTuple = function parseVariableDeclarationTuple(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  const { id } = expression.declarations[0];
  doParse(contract, id);
};

parse.WhileStatement = function parseWhileStatement(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  const { body } = expression;
  doParse(contract, body);
};

module.exports = parse;
