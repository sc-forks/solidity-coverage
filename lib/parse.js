/**
 * Methods in this file walk the AST and call the instrumenter
 * functions where appropriate, which determine where to inject events.
 * (Listed in alphabetical order)
 */
const Registrar = require('./registrar');
const register = new Registrar();
const util = require('util');

const parse = {};

parse.AssignmentExpression = function(contract, expression) {
  register.prePosition(expression);
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
    if (expression.expression.name === 'assert' || expression.expression.name === 'require') {
      register.assertOrRequire(contract, expression);
    }
    parse[expression.expression.type] &&
    parse[expression.expression.type](contract, expression.expression);
  } else {
    parse[expression.expression.type] &&
    parse[expression.expression.type](contract, expression.expression);
  }
};

parse.ConditionalExpression = function(contract, expression) {
  register.statement(contract, expression);
  register.conditionalExpression(contract, expression);
};

parse.ContractDefinition = function(contract, expression) {
  parse.ContractOrLibraryStatement(contract, expression);
};

parse.ContractOrLibraryStatement = function(contract, expression) {

  // We need to define a method to pass coverage hashes into at top of each contract.
  // This lets us get a fresh stack for the hash and avoid stack-too-deep errors.
  if (expression.kind !== 'interface'){
    const start = expression.range[0];
    const end = contract.instrumented.slice(expression.range[0]).indexOf('{') + 1;
    const loc = start + end;;

    (contract.injectionPoints[loc])
      ? contract.injectionPoints[loc].push({ type: 'injectHashMethod'})
      : contract.injectionPoints[loc] = [{ type: 'injectHashMethod'}];
  }

  if (expression.subNodes) {
    expression.subNodes.forEach(construct => {
      parse[construct.type] &&
      parse[construct.type](contract, construct);
    });
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
  parse.Modifiers(contract, expression.modifiers);
  if (expression.body) {
    register.functionDeclaration(contract, expression);
    parse[expression.body.type] &&
    parse[expression.body.type](contract, expression.body);
  }
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

parse.InterfaceStatement = function(contract, expression) {
  parse.ContractOrLibraryStatement(contract, expression);
};

parse.LibraryStatement = function(contract, expression) {
  parse.ContractOrLibraryStatement(contract, expression);
};

parse.MemberExpression = function(contract, expression) {
  parse[expression.object.type] &&
  parse[expression.object.type](contract, expression.object);
};

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

parse.SourceUnit = function(contract, expression) {
  expression.children.forEach(construct => {
    parse[construct.type] &&
    parse[construct.type](contract, construct);
  });
};

parse.ReturnStatement = function(contract, expression) {
  register.statement(contract, expression);
};

parse.UnaryExpression = function(contract, expression) {
  parse[expression.argument.type] &&
  parse[expression.argument.type](contract, expression.argument);
};

parse.UsingStatement = function (contract, expression) {
  parse[expression.for.type] &&
  parse[expression.for.type](contract, expression.for);
};

parse.VariableDeclarationStatement = function (contract, expression) {
  register.statement(contract, expression);
};

parse.VariableDeclarationTuple = function (contract, expression) {
  register.statement(contract, expression);
  parse[expression.declarations[0].id.type] &&
  parse[expression.declarations[0].id.type](contract, expression.declarations[0].id);
};

parse.WhileStatement = function (contract, expression) {
  register.statement(contract, expression);
  parse[expression.body.type] &&
  parse[expression.body.type](contract, expression.body);
};

module.exports = parse;
