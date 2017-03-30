const parse = {};
const instrumenter = require('./instrumenter');

// All the functions in this file do is walk the AST and call the instrumenter
// functions where appropriate, which determine where to inject events.

// Assign a dummy function to everything we might see in the AST
['AssignmentExpression',
  'BinaryExpression',
  'BlockStatement',
  'BreakStatement',
  'CallExpression',
  'ConditionalExpression',
  'ContinueStatement',
  'ContractStatement',
  'DebuggerStatement',
  'DeclarativeExpression',
  'DeclarativeExpressionList',
  'DenominationLiteral',
  'DoWhileStatement',
  'EmptyStatement',
  'EnumDeclaration',
  'EventDeclaration',
  'ExpressionStatement',
  'ForInStatement',
  'ForStatement',
  'FunctionDeclaration',
  'FunctionName',
  'Identifier',
  'IfStatement',
  'ImportStatement',
  'InformalParameter',
  'IsStatement',
  'LibraryStatement',
  'Literal',
  'MappingExpression',
  'MemberExpression',
  'ModifierArgument',
  'ModifierDeclaration',
  'ModifierName',
  'Modifiers',
  'NewExpression',
  'PlaceholderStatement',
  'PragmaStatement',
  'Program',
  'ReturnStatement',
  'SequenceExpression',
  'StateVariableDeclaration',
  'StructDeclaration',
  'ThisExpression',
  'ThrowStatement',
  'Type',
  'UnaryExpression',
  'UpdateExpression',
  'UsingStatement',
  'VariableDeclaration',
  'VariableDeclarationTuple',
  'VariableDeclarator',
  'WhileStatement'].forEach(key => {
    parse[key] = function dummyFunction() {};
  });

// Override the dummy functions where we know we can do better.

parse.AssignmentExpression = function parseAssignmentExpression(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  instrumenter.instrumentAssignmentExpression(contract, expression);
  // parse[expression.left.type](contract, expression.left);
  // parse[expression.right.type](contract, expression.right);
};

parse.ConditionalExpression = function parseConditionalExpression(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  instrumenter.instrumentConditionalExpression(contract, expression);
  // parse[expression.test.left.type](contract, expression.test.left);
  // parse[expression.test.right.type](contract, expression.test.right);
  // parse[expression.consequent.type](contract, expression.consequent);
  // parse[expression.alternate.type](contract, expression.alternate);
};

parse.Modifiers = function parseModifier(contract, modifiers) {
  if (modifiers) {
    modifiers.forEach(modifier => {
      parse[modifier.type](contract, modifier);
    });
  }
};

parse.ReturnStatement = function parseReturnStatement(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  // if (expression.argument){
    // parse[expression.argument.type](contract, expression.argument);
  // }
};

parse.NewExpression = function parseNewExpression(contract, expression) {
  parse[expression.callee.type](contract, expression.callee);
  // expression.arguments.forEach(construct => {
  //   parse[construct.type](construct);
  // });
};

parse.MemberExpression = function parseMemberExpression(contract, expression) {
  parse[expression.object.type](contract, expression.object);
  // parse[expression.property.type](contract, expression.property);
};

parse.CallExpression = function parseCallExpression(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  parse[expression.callee.type](contract, expression.callee);
  // for (x in expression.arguments){
    // parse[expression.arguments[x].type](contract, expression.arguments[x])
  // }
};

parse.UnaryExpression = function parseUnaryExpression(contract, expression) {
  parse[expression.argument.type](contract, expression.argument);
};

parse.ThrowStatement = function parseThrowStatement(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
};

parse.IfStatement = function parseIfStatement(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  instrumenter.instrumentIfStatement(contract, expression);
  // We can't instrument
  // if (x==1)
  //
  // So don't count x==1 as a statement - just the if as a whole.
  // parse[expression.test.type](contract, expression.test)
  parse[expression.consequent.type](contract, expression.consequent);
  if (expression.alternate) {
    parse[expression.alternate.type](contract, expression.alternate);
  }
};

parse.ExpressionStatement = function parseExpressionStatement(contract, content) {
  // if (instrument){instrumentStatement(content.expression)}
  parse[content.expression.type](contract, content.expression);
};

parse.VariableDeclarationTuple = function parseVariableDeclarationTuple(contract, expression) {
  parse[expression.init.type](contract, expression.init);
};

parse.BlockStatement = function parseBlockStatement(contract, expression) {
  for (let x = 0; x < expression.body.length; x++) {
    instrumenter.instrumentLine(contract, expression.body[x]);
    parse[expression.body[x].type](contract, expression.body[x]);
  }
};

parse.VariableDeclaration = function parseVariableDeclaration(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  if (expression.declarations.length > 1) {
    console.log('more than one declaration');
  }
  parse[expression.declarations[0].id.type](contract, expression.declarations[0].id);
  // parse[expression.declarations[0].init.type](contract, expression.declarations[0].init);
};

parse.UsingStatement = function parseUsingStatement(contract, expression) {
  parse[expression.for.type](contract, expression.for);
};

parse.FunctionDeclaration = function parseFunctionDeclaration(contract, expression) {
  parse.Modifiers(contract, expression.modifiers);
  if (expression.body) {
    instrumenter.instrumentFunctionDeclaration(contract, expression);
    parse[expression.body.type](contract, expression.body);
  }
};

parse.ContractOrLibraryStatement = function parseContractOrLibraryStatement(contract, expression) {
  // Inject our coverage event if we're covering
  // This is harder because of where .start and .end represent, and how documented comments are validated
  // by solc upon compilation. From the start of this contract statement, find the first '{', and inject
  // there.
  const injectionPoint = expression.start + contract.instrumented.slice(expression.start).indexOf('{') + 2;
  if (contract.injectionPoints[injectionPoint]) {
    contract.injectionPoints[expression.start + contract.instrumented.slice(expression.start).indexOf('{') + 2].push({
      type: 'eventDefinition',
    });
  } else {
    contract.injectionPoints[expression.start + contract.instrumented.slice(expression.start).indexOf('{') + 2] = [{
      type: 'eventDefinition',
    }];
  }

  expression.body.forEach(construct => {
    parse[construct.type](contract, construct);
  });
};

parse.ContractStatement = function ParseContractStatement(contract, expression) {
  parse.ContractOrLibraryStatement(contract, expression);
};

parse.LibraryStatement = function parseLibraryStatement(contract, expression) {
  parse.ContractOrLibraryStatement(contract, expression);
};

parse.ModifierDeclaration = function parseModifierDeclaration(contract, expression) {
  instrumenter.instrumentFunctionDeclaration(contract, expression);
  parse[expression.body.type](contract, expression.body);
};

parse.Program = function parseProgram(contract, expression) {
  expression.body.forEach(construct => {
    parse[construct.type](contract, construct);
  });
};

parse.WhileStatement = function parseWhileStatement(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  parse[expression.body.type](contract, expression.body);
};

parse.ForStatement = function parseForStatement(contract, expression) {
  instrumenter.instrumentStatement(contract, expression);
  parse[expression.body.type](contract, expression.body);
};

module.exports = parse;
