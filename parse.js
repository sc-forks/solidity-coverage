const parse = {};


function createOrAppendInjectionPoint(contract, key, value) {
  if (contract.injectionPoints[key]) {
    contract.injectionPoints[key].push(value);
  } else {
    contract.injectionPoints[key] = [value];
  }
}

function instrumentAssignmentExpression(contract, expression) {
  // The only time we instrument an assignment expression is if there's a conditional expression on
  // the right
  if (expression.right.type === 'ConditionalExpression') {
    if (expression.left.type === 'DeclarativeExpression' || expression.left.type === 'Identifier') {
      // Then we need to go from bytes32 varname = (conditional expression)
      // to             bytes32 varname; (,varname) = (conditional expression)
      createOrAppendInjectionPoint(contract, expression.left.end, {
        type: 'literal', string: '; (,' + expression.left.name + ')',
      });
      instrumentConditionalExpression(contract, expression.right);
    } else {
      console.log(contract, expression.left);
      process.exit();
    }
  }
}

function instrumentConditionalExpression(contract, expression) {
  contract.branchId += 1;

  const startline = (contract.instrumented.slice(0, expression.start).match(/\n/g) || []).length + 1;
  const startcol = expression.start - contract.instrumented.slice(0, expression.start).lastIndexOf('\n') - 1;
  const consequentStartCol = startcol + (contract, expression.consequent.start - expression.start);
  const consequentEndCol = consequentStartCol + (contract, expression.consequent.end - expression.consequent.start);
  const alternateStartCol = startcol + (contract, expression.alternate.start - expression.start);
  const alternateEndCol = alternateStartCol + (contract, expression.alternate.end - expression.alternate.start);
  // NB locations for conditional branches in istanbul are length 1 and associated with the : and ?.
  contract.branchMap[contract.branchId] = {
    line: startline,
    type: 'cond-expr',
    locations: [{
      start: {
        line: startline, column: consequentStartCol,
      },
      end: {
        line: startline, column: consequentEndCol,
      },
    }, {
      start: {
        line: startline, column: alternateStartCol,
      },
      end: {
        line: startline, column: alternateEndCol,
      },
    }],
  };
  // Right, this could be being used just by itself or as an assignment. In the case of the latter, because
  // the comma operator doesn't exist, we're going to have to get funky.
  // if we're on a line by ourselves, this is easier
  //
  // Now if we've got to wrap the expression it's being set equal to, do that...


  // Wrap the consequent
  createOrAppendInjectionPoint(contract, expression.consequent.start, {
    type: 'openParen',
  });
  createOrAppendInjectionPoint(contract, expression.consequent.start, {
    type: 'callBranchEvent', comma: true, branchId: contract.branchId, locationIdx: 0,
  });
  createOrAppendInjectionPoint(contract, expression.consequent.end, {
    type: 'closeParen',
  });

  // Wrap the alternate
  createOrAppendInjectionPoint(contract, expression.alternate.start, {
    type: 'openParen',
  });
  createOrAppendInjectionPoint(contract, expression.alternate.start, {
    type: 'callBranchEvent', comma: true, branchId: contract.branchId, locationIdx: 1,
  });
  createOrAppendInjectionPoint(contract, expression.alternate.end, {
    type: 'closeParen',
  });
}

function instrumentStatement(contract, expression) {
  contract.statementId += 1;
  // We need to work out the lines and columns the expression starts and ends
  const startline = (contract.instrumented.slice(0, expression.start).match(/\n/g) || []).length + 1;
  const startcol = expression.start - contract.instrumented.slice(0, expression.start).lastIndexOf('\n') - 1;
  const expressionContent = contract.instrumented.slice(expression.start, expression.end);

  const endline = startline + (contract, expressionContent.match('/\n/g') || []).length;
  let endcol;
  if (expressionContent.lastIndexOf('\n') >= 0) {
    endcol = contract.instrumented.slice(expressionContent.lastIndexOf('\n'), expression.end).length - 1;
  } else {
    endcol = startcol + (contract, expressionContent.length - 1);
  }
  contract.statementMap[contract.statementId] = {
    start: {
      line: startline, column: startcol,
    },
    end: {
      line: endline, column: endcol,
    },
  };
  createOrAppendInjectionPoint(contract, expression.start, {
    type: 'statement', statementId: contract.statementId,
  });
}

function instrumentLine(contract, expression) {
  // what's the position of the most recent newline?
  const startchar = expression.start;
  const endchar = expression.end;
  const lastNewLine = contract.instrumented.slice(0, startchar).lastIndexOf('\n');
  const nextNewLine = startchar + contract.instrumented.slice(startchar).indexOf('\n');
  const contractSnipped = contract.instrumented.slice(lastNewLine, nextNewLine);

  if (contract.instrumented.slice(lastNewLine, startchar).trim().length === 0 &&
      contract.instrumented.slice(endchar, nextNewLine).replace(';', '').trim().length === 0) {
    createOrAppendInjectionPoint(contract, lastNewLine + 1, {
      type: 'callEvent',
    });
  } else if (contract.instrumented.slice(lastNewLine, startchar).replace('{', '').trim().length === 0 &&
             contract.instrumented.slice(endchar, nextNewLine).replace(/[;}]/g, '').trim().length === 0) {
    createOrAppendInjectionPoint(contract, expression.start, {
      type: 'callEvent',
    });
  }
  // Is everything before us and after us on this line whitespace?
}

function instrumentFunctionDeclaration(contract, expression) {
  contract.fnId += 1;
  const startline = (contract.instrumented.slice(0, expression.start).match(/\n/g) || []).length + 1;
  // We need to work out the lines and columns the function declaration starts and ends
  const startcol = expression.start - contract.instrumented.slice(0, expression.start).lastIndexOf('\n') - 1;
  const endlineDelta = contract.instrumented.slice(expression.start).indexOf('{') + 1;
  const functionDefinition = contract.instrumented.slice(expression.start, expression.start + endlineDelta);
  const lastChar = contract.instrumented.slice(expression.start, expression.start + endlineDelta + 1).slice(-1);
  const endline = startline + (functionDefinition.match(/\n/g) || []).length;
  const endcol = functionDefinition.length - functionDefinition.lastIndexOf('\n');
  contract.fnMap[contract.fnId] = {
    name: expression.name,
    line: startline,
    loc: {
      start: {
        line: startline, column: startcol,
      },
      end: {
        line: endline, column: endcol,
      },
    },
  };
  if (lastChar === '}') {
    createOrAppendInjectionPoint(contract, expression.start + endlineDelta, {
      type: 'callFunctionEvent', fnId: contract.fnId,
    });
  } else {
    createOrAppendInjectionPoint(contract, expression.start + endlineDelta + 1, {
      type: 'callFunctionEvent', fnId: contract.fnId,
    });
  }
}

function instrumentIfStatement(contract, expression) {
  contract.branchId += 1;
  const startline = (contract.instrumented.slice(0, expression.start).match(/\n/g) || []).length + 1;
  const startcol = expression.start - contract.instrumented.slice(0, expression.start).lastIndexOf('\n') - 1;
  // NB locations for if branches in istanbul are zero length and associated with the start of the if.
  contract.branchMap[contract.branchId] = {
    line: startline,
    type: 'if',
    locations: [{
      start: {
        line: startline, column: startcol,
      },
      end: {
        line: startline, column: startcol,
      },
    }, {
      start: {
        line: startline, column: startcol,
      },
      end: {
        line: startline, column: startcol,
      },
    }],
  };
  if (expression.consequent.type === 'BlockStatement') {
    createOrAppendInjectionPoint(contract, expression.consequent.start + 1, {
      type: 'callBranchEvent', branchId: contract.branchId, locationIdx: 0,
    });
  }
  if (expression.alternate && expression.alternate.type === 'IfStatement') {
    // Do nothing - we must be pre-preprocessor, so don't bother instrumenting -
    // when we're actually instrumenting, this will never happen (we've wrapped it in
    // a block statement)
  } else if (expression.alternate && expression.alternate.type === 'BlockStatement') {
    createOrAppendInjectionPoint(contract, expression.alternate.start + 1, {
      type: 'callBranchEvent', branchId: contract.branchId, locationIdx: 1,
    });
  } else {
    createOrAppendInjectionPoint(contract, expression.consequent.end, {
      type: 'callEmptyBranchEvent', branchId: contract.branchId, locationIdx: 1,
    });
  }
}

parse.AssignmentExpression = function parseAssignmentExpression(contract, expression) {
  instrumentStatement(contract, expression);
  instrumentAssignmentExpression(contract, expression);
  // parse[expression.left.type](contract, expression.left);
  // parse[expression.right.type](contract, expression.right);
};

parse.ConditionalExpression = function parseConditionalExpression(contract, expression) {
  instrumentStatement(contract, expression);
  instrumentConditionalExpression(contract, expression);
  // parse[expression.test.left.type](contract, expression.test.left);
  // parse[expression.test.right.type](contract, expression.test.right);
  // parse[expression.consequent.type](contract, expression.consequent);
  // parse[expression.alternate.type](contract, expression.alternate);
};

parse.Identifier = function parseIdentifier(contract, expression) {
};

parse.InformalParameter = function parseInformalParameter(contract, expression) {
};

parse.Literal = function ParseLiteral(contract, expression) {
};

parse.ModifierName = function ParseModifierName(contract, expression) {
};

parse.Modifiers = function parseModifier(contract, modifiers) {
  if (modifiers) {
    modifiers.forEach(modifier => {
      parse[modifier.type](contract, modifier);
    });
  }
};

parse.ThisExpression = function parseThisExpression(contract, expression) {
};

parse.ReturnStatement = function parseReturnStatement(contract, expression) {
  instrumentStatement(contract, expression);
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
  instrumentStatement(contract, expression);
  parse[expression.callee.type](contract, expression.callee);
  // for (x in expression.arguments){
    // parse[expression.arguments[x].type](contract, expression.arguments[x])
  // }
};

parse.UnaryExpression = function parseUnaryExpression(contract, expression) {
  parse[expression.argument.type](contract, expression.argument);
};

parse.ThrowStatement = function parseThrowStatement(contract, expression) {
  instrumentStatement(contract, expression);
};

parse.DenominationLiteral = function parseDenominationLiteral(contract, expression) {
};

parse.BinaryExpression = function parseBinaryExpression(contract, expression) {
  // parse[expression.left.type](contract, expression.left);
  // parse[expression.right.type](contract, expression.right);
};

parse.IfStatement = function parseIfStatement(contract, expression) {
  instrumentStatement(contract, expression);
  instrumentIfStatement(contract, expression);
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

parse.SequenceExpression = function parseSequenceExpression(contract, expression) {
};

parse.ImportStatement = function parseImportStatemtn(contract, expression) {
};

parse.DeclarativeExpression = function parseDeclarativeExpression(contract, expression) {
};

parse.ExpressionStatement = function parseExpressionStatement(contract, content) {
  // if (instrument){instrumentStatement(content.expression)}
  parse[content.expression.type](contract, content.expression);
};

parse.EnumDeclaration = function parseEnumDeclaration(contract, expression) {
};

parse.EventDeclaration = function parseEventDeclaration(contract, expression) {
};

parse.VariableDeclarationTuple = function parseVariableDeclarationTuple(contract, expression) {
  parse[expression.init.type](contract, expression.init);
};

parse.BlockStatement = function parseBlockStatement(contract, expression) {
  for (let x = 0; x < expression.body.length; x++) {
    instrumentLine(contract, expression.body[x]);
    parse[expression.body[x].type](contract, expression.body[x]);
  }
};

parse.VariableDeclaration = function parseVariableDeclaration(contract, expression) {
  instrumentStatement(contract, expression);
  if (expression.declarations.length > 1) {
    console.log('more than one declaration');
  }
  parse[expression.declarations[0].id.type](contract, expression.declarations[0].id);
  // parse[expression.declarations[0].init.type](contract, expression.declarations[0].init);
};

parse.Type = function parseType(contract, expression) {
};

parse.UsingStatement = function parseUsingStatement(contract, expression) {
  parse[expression.for.type](contract, expression.for);
};

parse.FunctionDeclaration = function parseFunctionDeclaration(contract, expression) {
  parse.Modifiers(contract, expression.modifiers);
  if (expression.body) {
    instrumentFunctionDeclaration(contract, expression);
    parse[expression.body.type](contract, expression.body);
  }
};

parse.ContractStatement = function parseContractStatement(contract, expression) {
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
    if (!Array.isArray(construct)) {
      parse[construct.type](contract, construct);
    }
  });
};

parse.LibraryStatement = function parseLibraryStatement(contract, expression) {
  // Inject our coverage event;
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

parse.ModifierDeclaration = function parseModifierDeclaration(contract, expression) {
  instrumentFunctionDeclaration(contract, expression);
  parse[expression.body.type](contract, expression.body);
};

parse.Program = function parseProgram(contract, expression) {
  expression.body.forEach(construct => {
    parse[construct.type](contract, construct);
  });
};

parse.WhileStatement = function parseWhileStatement(contract, expression) {
  instrumentStatement(contract, expression);
  parse[expression.body.type](contract, expression.body);
};

parse.ForStatement = function parseForStatement(contract, expression) {
  instrumentStatement(contract, expression);
  parse[expression.body.type](contract, expression.body);
};

parse.StructDeclaration = function parseStructDeclaration(contract, expression) {
};

parse.PragmaStatement = function parsePragmaStatement(contract, expression) {
};

parse.UpdateExpression = function parseUpdateExpression(contract, expression) {
};

parse.MappingExpression = function parseMappingExpression(contract, expression) {
};

parse.VariableDeclarator = function parseVariableDeclarator(contract, expression) {
};

parse.EmptyStatement = function parseEmptyStatement(contract, expression) {
};

parse.DebuggerStatement = function parseDebuggerStatement(contract, expression) {
};

parse.IsStatement = function parseIsStatement(contract, expression) {
};

parse.DeclarativeExpressionList = function parseDeclarativeExpressionList(contract, expression) {
};

parse.ModifierArgument = function parseModifierArgument(contract, expression) {
};

parse.PlaceholderStatement = function parsePlaceholderStatement(contract, expression) {
};

parse.FunctionName = function parseFunctionName(contract, expression) {
};

parse.DoWhileStatement = function parseDoWhileStatement(contract, expression) {
};

parse.ForInStatement = function parseForInStatement(contract, expression) {
};

parse.ContinueStatement = function ParseContinueStatement(contract, expression) {
};

parse.BreakStatement = function parseBreakStatement(contract, expression) {
};

module.exports = parse;
