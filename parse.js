const parse = {};


function createOrAppendInjectionPoint(contract, key, value) {
  if (contract.injectionPoints[key]) {
    contract.injectionPoints[key].push(value);
  } else {
    contract.injectionPoints[key] = [value];
  }
}

function instrumentAssignmentExpression(contract, expression, instrument) {
  // The only time we instrument an assignment expression is if there's a conditional expression on
  // the right
  if (expression.right.type === 'ConditionalExpression') {
    if (expression.left.type === 'DeclarativeExpression' || expression.left.type === 'Identifier') {
      // Then we need to go from bytes32 varname = (conditional expression)
      // to             bytes32 varname; (,varname) = (conditional expression)
      if (instrument) {
        createOrAppendInjectionPoint(contract, expression.left.end, {
          type: 'literal', string: '; (,' + expression.left.name + ')',
        });
      }
      instrumentConditionalExpression(contract, expression.right, instrument);
    } else {
      console.log(contract, expression.left);
      process.exit();
    }
  }
}

function instrumentConditionalExpression(contract, expression, instrument) {
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
  if (instrument) {
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
}

function instrumentStatement(contract, expression, instrument) {
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
  if (instrument) {
    createOrAppendInjectionPoint(contract, expression.start, {
      type: 'statement', statementId: contract.statementId,
    });
  }
}

function instrumentLine(contract, expression, instrument) {
  // what's the position of the most recent newline?
  const startchar = expression.start;
  const endchar = expression.end;
  const lastNewLine = contract.instrumented.slice(0, startchar).lastIndexOf('\n');
  const nextNewLine = startchar + contract.instrumented.slice(startchar).indexOf('\n');
  const contractSnipped = contract.instrumented.slice(lastNewLine, nextNewLine);

  if (instrument) {
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
  }
  // Is everything before us and after us on this line whitespace?
}

function instrumentFunctionDeclaration(contract, expression, instrument) {
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
  if (instrument) {
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
}

function instrumentIfStatement(contract, expression, instrument) {
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
  if (instrument) {
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
}

parse.AssignmentExpression = function parseAssignmentExpression(contract, expression, instrument) {
  instrumentStatement(contract, expression, instrument);
  instrumentAssignmentExpression(contract, expression, instrument);
  // parse[expression.left.type](contract, expression.left, instrument);
  // parse[expression.right.type](contract, expression.right, instrument);
};

parse.ConditionalExpression = function parseConditionalExpression(contract, expression, instrument) {
  instrumentStatement(contract, expression, instrument);
  instrumentConditionalExpression(contract, expression, instrument);
  // parse[expression.test.left.type](contract, expression.test.left, instrument);
  // parse[expression.test.right.type](contract, expression.test.right, instrument);
  // parse[expression.consequent.type](contract, expression.consequent, instrument);
  // parse[expression.alternate.type](contract, expression.alternate, instrument);
};

parse.Identifier = function parseIdentifier(contract, expression, instrument) {
};

parse.InformalParameter = function parseInformalParameter(contract, expression, instrument) {
};

parse.Literal = function ParseLiteral(contract, expression, instrument) {
};

parse.ModifierName = function ParseModifierName(contract, expression, instrument) {
};

parse.Modifiers = function parseModifier(contract, modifiers, instrument) {
  if (modifiers) {
    modifiers.forEach(modifier => {
      parse[modifier.type](contract, modifier, instrument);
    });
  }
};

parse.ThisExpression = function parseThisExpression(contract, expression, instrument) {
};

parse.ReturnStatement = function parseReturnStatement(contract, expression, instrument) {
  instrumentStatement(contract, expression, instrument);
  // if (expression.argument){
    // parse[expression.argument.type](contract, expression.argument, instrument);
  // }
};

parse.NewExpression = function parseNewExpression(contract, expression, instrument) {
  parse[expression.callee.type](contract, expression.callee, instrument);
  // expression.arguments.forEach(construct => {
  //   parse[construct.type](construct, instrument);
  // });
};

parse.MemberExpression = function parseMemberExpression(contract, expression, instrument) {
  parse[expression.object.type](contract, expression.object, instrument);
  // parse[expression.property.type](contract, expression.property, instrument);
};

parse.CallExpression = function parseCallExpression(contract, expression, instrument) {
  instrumentStatement(contract, expression, instrument);
  parse[expression.callee.type](contract, expression.callee, instrument);
  // for (x in expression.arguments){
    // parse[expression.arguments[x].type](contract, expression.arguments[x], instrument)
  // }
};

parse.UnaryExpression = function parseUnaryExpression(contract, expression, instrument) {
  parse[expression.argument.type](contract, expression.argument, instrument);
};

parse.ThrowStatement = function parseThrowStatement(contract, expression, instrument) {
  instrumentStatement(contract, expression, instrument);
};

parse.DenominationLiteral = function parseDenominationLiteral(contract, expression, instrument) {
};

parse.BinaryExpression = function parseBinaryExpression(contract, expression, instrument) {
  // parse[expression.left.type](contract, expression.left, instrument);
  // parse[expression.right.type](contract, expression.right, instrument);
};

parse.IfStatement = function parseIfStatement(contract, expression, instrument) {
  instrumentStatement(contract, expression, instrument);
  instrumentIfStatement(contract, expression, instrument);
  // We can't instrument
  // if (x==1)
  //
  // So don't count x==1 as a statement - just the if as a whole.
  // parse[expression.test.type](contract, expression.test, instrument)
  parse[expression.consequent.type](contract, expression.consequent, instrument);
  if (expression.alternate) {
    parse[expression.alternate.type](contract, expression.alternate, instrument);
  }
};

parse.SequenceExpression = function parseSequenceExpression(contract, expression, instrument) {
};

parse.ImportStatement = function parseImportStatemtn(contract, expression, instrument) {
};

parse.DeclarativeExpression = function parseDeclarativeExpression(contract, expression, instrument) {
};

parse.ExpressionStatement = function parseExpressionStatement(contract, content, instrument) {
  // if (instrument){instrumentStatement(content.expression)}
  parse[content.expression.type](contract, content.expression, instrument);
};

parse.EnumDeclaration = function parseEnumDeclaration(contract, expression, instrument) {
};

parse.EventDeclaration = function parseEventDeclaration(contract, expression, instrument) {
};

parse.VariableDeclarationTuple = function parseVariableDeclarationTuple(contract, expression, instrument) {
  parse[expression.init.type](contract, expression.init, instrument);
};

parse.BlockStatement = function parseBlockStatement(contract, expression, instrument) {
  for (let x = 0; x < expression.body.length; x++) {
    instrumentLine(contract, expression.body[x], instrument);
    parse[expression.body[x].type](contract, expression.body[x], instrument);
  }
};

parse.VariableDeclaration = function parseVariableDeclaration(contract, expression, instrument) {
  instrumentStatement(contract, expression, instrument);
  if (expression.declarations.length > 1) {
    console.log('more than one declaration');
  }
  parse[expression.declarations[0].id.type](contract, expression.declarations[0].id, instrument);
  // parse[expression.declarations[0].init.type](contract, expression.declarations[0].init, instrument);
};

parse.Type = function parseType(contract, expression, instrument) {
};

parse.UsingStatement = function parseUsingStatement(contract, expression, instrument) {
  parse[expression.for.type](contract, expression.for, instrument);
};

parse.FunctionDeclaration = function parseFunctionDeclaration(contract, expression, instrument) {
  parse.Modifiers(contract, expression.modifiers, instrument);
  if (expression.body) {
    instrumentFunctionDeclaration(contract, expression, instrument);
    parse[expression.body.type](contract, expression.body, instrument);
  }
};

parse.ContractStatement = function parseContractStatement(contract, expression, instrument) {
  // Inject our coverage event if we're covering
  if (instrument) {
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
  }

  expression.body.forEach(construct => {
    if (!Array.isArray(construct)) {
      parse[construct.type](contract, construct, instrument);
    }
  });
};

parse.LibraryStatement = function parseLibraryStatement(contract, expression, instrument) {
  // Inject our coverage event;
  if (instrument) {
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
  }
  expression.body.forEach(construct => {
    parse[construct.type](contract, construct, instrument);
  });
};

parse.ModifierDeclaration = function parseModifierDeclaration(contract, expression, instrument) {
  instrumentFunctionDeclaration(contract, expression, instrument);
  parse[expression.body.type](contract, expression.body, instrument);
};

parse.Program = function parseProgram(contract, expression, instrument) {
  expression.body.forEach(construct => {
    parse[construct.type](contract, construct, instrument);
  });
};

parse.WhileStatement = function parseWhileStatement(contract, expression, instrument) {
  instrumentStatement(contract, expression, instrument);
  parse[expression.body.type](contract, expression.body, instrument);
};

parse.ForStatement = function parseForStatement(contract, expression, instrument) {
  instrumentStatement(contract, expression, instrument);
  parse[expression.body.type](contract, expression.body, instrument);
};

parse.StructDeclaration = function parseStructDeclaration(contract, expression, instrument) {
};

parse.PragmaStatement = function parsePragmaStatement(contract, expression, instrument) {
};

parse.UpdateExpression = function parseUpdateExpression(contract, expression, instrument) {
};

parse.MappingExpression = function parseMappingExpression(contract, expression, instrument) {
};

parse.VariableDeclarator = function parseVariableDeclarator(contract, expression, instrument) {
};

parse.EmptyStatement = function parseEmptyStatement(contract, expression, instrument) {
};

parse.DebuggerStatement = function parseDebuggerStatement(contract, expression, instrument) {
};

parse.IsStatement = function parseIsStatement(contract, expression, instrument) {
};

parse.DeclarativeExpressionList = function parseDeclarativeExpressionList(contract, expression, instrument) {
};

parse.ModifierArgument = function parseModifierArgument(contract, expression, instrument) {
};

parse.PlaceholderStatement = function parsePlaceholderStatement(contract, expression, instrument) {
};

parse.FunctionName = function parseFunctionName(contract, expression, instrument) {
};

parse.DoWhileStatement = function parseDoWhileStatement(contract, expression, instrument) {
};

parse.ForInStatement = function parseForInStatement(contract, expression, instrument) {
};

parse.ContinueStatement = function ParseContinueStatement(contract, expression, instrument) {
};

parse.BreakStatement = function parseBreakStatement(contract, expression, instrument) {
};

module.exports = parse;
