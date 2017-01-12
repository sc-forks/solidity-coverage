const SolidityParser = require('solidity-parser');
const preprocessor = require('./preprocessor');

// var solparse = require("solparse");

const path = require('path');

module.exports = function instruentSolidity(contract, fileName, instrumentingActive) {
  const parse = {};
  let runnableLines = [];
  let fnMap = {};
  let fnId = 0;
  let branchMap = {};
  let branchId = 0;
  let statementMap = {};
  let statementId = 0;
  let injectionPoints = {};

  function createOrAppendInjectionPoint(key, value) {
    if (injectionPoints[key]) {
      injectionPoints[key].push(value);
    } else {
      injectionPoints[key] = [value];
    }
  }

  function instrumentAssignmentExpression(expression) {
    // The only time we instrument an assignment expression is if there's a conditional expression on
    // the right
    if (expression.right.type === 'ConditionalExpression') {
      if (expression.left.type === 'DeclarativeExpression') {
        // Then we need to go from bytes32 varname = (conditional expression)
        // to             bytes32 varname; (,varname) = (conditional expression)
        createOrAppendInjectionPoint(expression.left.end, {
          type: 'literal', string: '; (,' + expression.left.name + ')',
        });
      } else {
        console.log(expression.left);
        process.exit();
      }
    }
  }

  function instrumentConditionalExpression(expression) {
    branchId += 1;

    const startline = (contract.slice(0, expression.start).match(/\n/g) || []).length + 1;
    const startcol = expression.start - contract.slice(0, expression.start).lastIndexOf('\n') - 1;
    const consequentStartCol = startcol + (expression.consequent.start - expression.start);
    const consequentEndCol = consequentStartCol + (expression.consequent.end - expression.consequent.start);
    const alternateStartCol = startcol + (expression.alternate.start - expression.start);
    const alternateEndCol = alternateStartCol + (expression.alternate.end - expression.alternate.start);
    // NB locations for conditional branches in istanbul are length 1 and associated with the : and ?.
    branchMap[branchId] = {
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
    createOrAppendInjectionPoint(expression.consequent.start, {
      type: 'openParen',
    });
    createOrAppendInjectionPoint(expression.consequent.start, {
      type: 'callBranchEvent', comma: true, branchId, locationIdx: 0,
    });
    createOrAppendInjectionPoint(expression.consequent.end, {
      type: 'closeParen',
    });

    // Wrap the alternate
    createOrAppendInjectionPoint(expression.alternate.start, {
      type: 'openParen',
    });
    createOrAppendInjectionPoint(expression.alternate.start, {
      type: 'callBranchEvent', comma: true, branchId, locationIdx: 1,
    });
    createOrAppendInjectionPoint(expression.alternate.end, {
      type: 'closeParen',
    });
  }

  function instrumentStatement(expression) {
    statementId += 1;
    // We need to work out the lines and columns the expression starts and ends
    const startline = (contract.slice(0, expression.start).match(/\n/g) || []).length + 1;
    const startcol = expression.start - contract.slice(0, expression.start).lastIndexOf('\n') - 1;
    const expressionContent = contract.slice(expression.start, expression.end);

    const endline = startline + (expressionContent.match('/\n/g') || []).length;
    let endcol;
    if (expressionContent.lastIndexOf('\n') >= 0) {
      endcol = contract.slice(expressionContent.lastIndexOf('\n'), expression.end).length - 1;
    } else {
      endcol = startcol + (expressionContent.length - 1);
    }
    statementMap[statementId] = {
      start: {
        line: startline, column: startcol,
      },
      end: {
        line: endline, column: endcol,
      },
    };
    createOrAppendInjectionPoint(expression.start, {
      type: 'statement', statementId,
    });
  }

  function instrumentLine(expression) {
    // what's the position of the most recent newline?
    const startchar = expression.start;
    const endchar = expression.end;
    const lastNewLine = contract.slice(0, startchar).lastIndexOf('\n');
    const nextNewLine = startchar + contract.slice(startchar).indexOf('\n');
    const contractSnipped = contract.slice(lastNewLine, nextNewLine);

    // Is everything before us and after us on this line whitespace?
    if (contract.slice(lastNewLine, startchar).trim().length === 0 && contract.slice(endchar, nextNewLine).replace(';', '').trim().length === 0) {
      createOrAppendInjectionPoint(lastNewLine + 1, {
        type: 'callEvent',
      });
    } else if (contract.slice(lastNewLine, startchar).replace('{', '').trim().length === 0 &&
               contract.slice(endchar, nextNewLine).replace(/[;}]/g, '').trim().length === 0) {
      createOrAppendInjectionPoint(expression.start, {
        type: 'callEvent',
      });
    }
  }

  function instrumentFunctionDeclaration(expression) {
    fnId += 1;
    const startline = (contract.slice(0, expression.start).match(/\n/g) || []).length + 1;
    // We need to work out the lines and columns the function declaration starts and ends
    const startcol = expression.start - contract.slice(0, expression.start).lastIndexOf('\n') - 1;
    const endlineDelta = contract.slice(expression.start).indexOf('{') + 1;
    const functionDefinition = contract.slice(expression.start, expression.start + endlineDelta);
    const lastChar = contract.slice(expression.start, expression.start + endlineDelta + 1).slice(-1);
    const endline = startline + (functionDefinition.match(/\n/g) || []).length;
    const endcol = functionDefinition.length - functionDefinition.lastIndexOf('\n');
    fnMap[fnId] = {
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
      createOrAppendInjectionPoint(expression.start + endlineDelta, {
        type: 'callFunctionEvent', fnId,
      });
    } else {
      createOrAppendInjectionPoint(expression.start + endlineDelta + 1, {
        type: 'callFunctionEvent', fnId,
      });
    }
  }

  function instrumentIfStatement(expression) {
    branchId += 1;
    const startline = (contract.slice(0, expression.start).match(/\n/g) || []).length + 1;
    const startcol = expression.start - contract.slice(0, expression.start).lastIndexOf('\n') - 1;
    // NB locations for if branches in istanbul are zero length and associated with the start of the if.
    branchMap[branchId] = {
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
      createOrAppendInjectionPoint(expression.consequent.start + 1, {
        type: 'callBranchEvent', branchId, locationIdx: 0,
      });
    }
    if (expression.alternate && expression.alternate.type === 'IfStatement') {
      createOrAppendInjectionPoint(expression.alternate.start, {
        type: 'callBranchEvent', branchId, locationIdx: 1, openBracket: true,
      });
      createOrAppendInjectionPoint(expression.alternate.end, {
        type: 'closeBracketEnd',
      });
      // It should get instrumented when we parse it
    } else if (expression.alternate && expression.alternate.type === 'BlockStatement') {
      createOrAppendInjectionPoint(expression.alternate.start + 1, {
        type: 'callBranchEvent', branchId, locationIdx: 1,
      });
    } else {
      createOrAppendInjectionPoint(expression.consequent.end, {
        type: 'callEmptyBranchEvent', branchId, locationIdx: 1,
      });
    }
  }

  parse.AssignmentExpression = function parseAssignmentExpression(expression, instrument) {
    if (instrument) { instrumentStatement(expression); }
    if (instrument) { instrumentAssignmentExpression(expression); }
    // parse[expression.left.type](expression.left, instrument);
    // parse[expression.right.type](expression.right, instrument);
  };

  parse.ConditionalExpression = function parseConditionalExpression(expression, instrument) {
    if (instrument) { instrumentConditionalExpression(expression); }
    parse[expression.test.left.type](expression.test.left, instrument);
    parse[expression.test.right.type](expression.test.right, instrument);
    parse[expression.consequent.type](expression.consequent, instrument);
    parse[expression.alternate.type](expression.alternate, instrument);
  };

  parse.Identifier = function parseIdentifier(expression, instrument) {
  };

  parse.InformalParameter = function parseInformalParameter(expression, instrument) {
  };

  parse.Literal = function ParseLiteral(expression, instrument) {
  };

  parse.ModifierName = function ParseModifierName(expression, instrument) {
  };

  parse.Modifiers = function parseModifier(modifiers, instrument) {
    if (modifiers) {
      modifiers.forEach(modifier => {
        parse[modifier.type](modifier, instrument);
      });
    }
  };

  parse.ThisExpression = function parseThisExpression(expression, instrument) {
  };

  parse.ReturnStatement = function parseReturnStatement(expression, instrument) {
    if (instrument) { instrumentStatement(expression); }
    // if (expression.argument){
      // parse[expression.argument.type](expression.argument, instrument);
    // }
  };

  parse.NewExpression = function parseNewExpression(expression, instrument) {
    parse[expression.callee.type](expression.callee, instrument);
    expression.forEach(construct => {
      parse[construct.type](construct, instrument);
    });
  };

  parse.MemberExpression = function parseMemberExpression(expression, instrument) {
    parse[expression.object.type](expression.object, instrument);
    // parse[expression.property.type](expression.property, instrument);
  };

  parse.CallExpression = function parseCallExpression(expression, instrument) {
    if (instrument) { instrumentStatement(expression); }
    parse[expression.callee.type](expression.callee, instrument);
    // for (x in expression.arguments){
      // parse[expression.arguments[x].type](expression.arguments[x], instrument)
    // }
  };

  parse.UnaryExpression = function parseUnaryExpression(expression, instrument) {
    parse[expression.argument.type](expression.argument, instrument);
  };

  parse.ThrowStatement = function parseThrowStatement(expression, instrument) {
    if (instrument) { instrumentStatement(expression); }
  };

  parse.DenominationLiteral = function parseDenominationLiteral(expression, instrument) {
  };

  parse.BinaryExpression = function parseBinaryExpression(expression, instrument) {
    parse[expression.left.type](expression.left, instrument);
    parse[expression.right.type](expression.right, instrument);
  };

  parse.IfStatement = function parseIfStatement(expression, instrument) {
    if (instrument) { instrumentStatement(expression); }
    if (instrument) { instrumentIfStatement(expression); }
    // We can't instrument
    // if (x==1)
    //
    // So don't count x==1 as a statement - just the if as a whole.
    // parse[expression.test.type](expression.test, instrument)
    parse[expression.consequent.type](expression.consequent, instrument);
    if (expression.alternate) {
      parse[expression.alternate.type](expression.alternate, instrument);
    }
  };

  parse.SequenceExpression = function parseSequenceExpression(expression, instrument) {
  };

  parse.ImportStatement = function parseImportStatemtn(expression, instrument) {
  };

  parse.DeclarativeExpression = function parseDeclarativeExpression(expression, instrument) {
  };

  parse.ExpressionStatement = function parseExpressionStatement(content, instrument) {
    // if (instrument){instrumentStatement(content.expression)}
    parse[content.expression.type](content.expression, instrument);
  };

  parse.EnumDeclaration = function parseEnumDeclaration(expression, instrument) {
  };

  parse.EventDeclaration = function parseEventDeclaration(expression, instrument) {
  };

  parse.VariableDeclarationTuple = function parseVariableDeclarationTuple(expression, instrument) {
    parse[expression.init.type](expression.init, instrument);
  };

  parse.BlockStatement = function parseBlockStatement(expression, instrument) {
    for (let x = 0; x < expression.body.length; x++) {
      if (instrument) { instrumentLine(expression.body[x]); }
      parse[expression.body[x].type](expression.body[x], instrument);
    }
  };

  parse.VariableDeclaration = function parseVariableDeclaration(expression, instrument) {
    if (instrument) { instrumentStatement(expression); }
    if (expression.declarations.length > 1) {
      console.log('more than one declaration');
    }
    parse[expression.declarations[0].id.type](expression.declarations[0].id, instrument);
    // parse[expression.declarations[0].init.type](expression.declarations[0].init, instrument);
  };

  parse.Type = function parseType(expression, instrument) {
  };

  parse.UsingStatement = function parseUsingStatement(expression, instrument) {
    parse[expression.for.type](expression.for, instrument);
  };

  parse.FunctionDeclaration = function parseFunctionDeclaration(expression, instrument) {
    parse.Modifiers(expression.modifiers, instrument);
    if (expression.body) {
      instrumentFunctionDeclaration(expression);
      parse[expression.body.type](expression.body, instrumentingActive);
    }
  };

  parse.ContractStatement = function parseContractStatement(expression, instrument) {
    // Inject our coverage event if we're covering
    if (instrumentingActive) {
      // This is harder because of where .start and .end represent, and how documented comments are validated
      // by solc upon compilation. From the start of this contract statement, find the first '{', and inject
      // there.
      const injectionPoint = expression.start + contract.slice(expression.start).indexOf('{') + 2;
      if (injectionPoints[injectionPoint]) {
        injectionPoints[expression.start + contract.slice(expression.start).indexOf('{') + 2].push({
          type: 'eventDefinition',
        });
      } else {
        injectionPoints[expression.start + contract.slice(expression.start).indexOf('{') + 2] = [{
          type: 'eventDefinition',
        }];
      }
    }

    expression.body.forEach(construct => {
      if (!Array.isArray(construct)) {
        parse[construct.type](construct, instrument);
      }
    });
  };

  parse.LibraryStatement = function parseLibraryStatement(expression, instrument) {
    // Inject our coverage event;
    if (instrumentingActive) {
      // This is harder because of where .start and .end represent, and how documented comments are validated
      // by solc upon compilation. From the start of this contract statement, find the first '{', and inject
      // there.
      const injectionPoint = expression.start + contract.slice(expression.start).indexOf('{') + 2;
      if (injectionPoints[injectionPoint]) {
        injectionPoints[expression.start + contract.slice(expression.start).indexOf('{') + 2].push({
          type: 'eventDefinition',
        });
      } else {
        injectionPoints[expression.start + contract.slice(expression.start).indexOf('{') + 2] = [{
          type: 'eventDefinition',
        }];
      }
    }
    expression.body.forEach(construct => {
      parse[construct.type](construct, instrument);
    });
  };

  parse.ModifierDeclaration = function parseModifierDeclaration(expression, instrument) {
    instrumentFunctionDeclaration(expression);
    parse[expression.body.type](expression.body, instrumentingActive);
  };

  parse.Program = function parseProgram(expression, instrument) {
    expression.body.forEach(construct => {
      parse[construct.type](construct, instrument);
    });
  };

  parse.WhileStatement = function parseWhileStatement(expression, instrument) {
    if (instrument) { instrumentStatement(expression); }
    parse[expression.body.type](expression.body, instrument);
  };

  parse.ForStatement = function parseForStatement(expression, instrument) {
    if (instrument) { instrumentStatement(expression); }
    parse[expression.body.type](expression.body, instrument);
  };

  parse.StructDeclaration = function parseStructDeclaration(expression, instrument) {
  };

  parse.PragmaStatement = function parsePragmaStatement(expression, instrument) {
  };

  parse.UpdateExpression = function parseUpdateExpression(expression, instrument) {
  };

  parse.MappingExpression = function parseMappingExpression(expression, instrument) {
  };

  parse.VariableDeclarator = function parseVariableDeclarator(expression, instrument) {
  };

  parse.EmptyStatement = function parseEmptyStatement(expression, instrument) {
  };

  parse.DebuggerStatement = function parseDebuggerStatement(expression, instrument) {
  };

  parse.IsStatement = function parseIsStatement(expression, instrument) {
  };

  parse.DeclarativeExpressionList = function parseDeclarativeExpressionList(expression, instrument) {
  };

  parse.ModifierArgument = function parseModifierArgument(expression, instrument) {
  };

  parse.PlaceholderStatement = function parsePlaceholderStatement(expression, instrument) {
  };

  parse.FunctionName = function parseFunctionName(expression, instrument) {
  };

  parse.DoWhileStatement = function parseDoWhileStatement(expression, instrument) {
  };

  parse.ForInStatement = function parseForInStatement(expression, instrument) {
  };

  parse.ContinueStatement = function ParseContinueStatement(expression, instrument) {
  };

  parse.BreakStatement = function parseBreakStatement(expression, instrument) {
  };

  const injector = {};
  injector.callEvent = function injectCallEvent(injectionPoint) {
    const linecount = (contract.slice(0, injectionPoint).match(/\n/g) || []).length + 1;
    runnableLines.push(linecount);
    contract = contract.slice(0, injectionPoint) + 'Coverage(\'' + fileName + '\',' + linecount + ');\n' + contract.slice(injectionPoint);
  };

  injector.callFunctionEvent = function injectCallFunctionEvent(injectionPoint, injection) {
    contract = contract.slice(0, injectionPoint) +
      'FunctionCoverage(\'' + fileName + '\',' + injection.fnId + ');\n' +
      contract.slice(injectionPoint);
  };

  injector.callBranchEvent = function injectCallFunctionEvent(injectionPoint, injection) {
    contract = contract.slice(0, injectionPoint) +
      (injection.openBracket ? '{' : '') +
      'BranchCoverage(\'' + fileName + '\',' + injection.branchId + ',' + injection.locationIdx + ')' +
      (injection.comma ? ',' : ';') +
      contract.slice(injectionPoint);
  };

  injector.callEmptyBranchEvent = function injectCallEmptyBranchEvent(injectionPoint, injection) {
    contract = contract.slice(0, injectionPoint) +
      'else { BranchCoverage(\'' + fileName + '\',' + injection.branchId + ',' + injection.locationIdx + ');}\n' +
      contract.slice(injectionPoint);
  };

  injector.openParen = function injectOpenParen(injectionPoint, injection) {
    contract = contract.slice(0, injectionPoint) + '(' + contract.slice(injectionPoint);
  };

  injector.closeParen = function injectCloseParen(injectionPoint, injection) {
    contract = contract.slice(0, injectionPoint) + ')' + contract.slice(injectionPoint);
  };

  injector.closeBracketStart = function injectCloseBracketStart(injectionPoint, injection) {
    contract = contract.slice(0, injectionPoint) + '}' + contract.slice(injectionPoint);
  };

  injector.closeBracketEnd = function injectCloseBracketEnd(injectionPoint, injection) {
    contract = contract.slice(0, injectionPoint) + '}' + contract.slice(injectionPoint);
  };

  injector.literal = function injectLiteral(injectionPoint, injection) {
    contract = contract.slice(0, injectionPoint) + injection.string + contract.slice(injectionPoint);
  };

  injector.statement = function injectStatement(injectionPoint, injection) {
    contract = contract.slice(0, injectionPoint) +
      ' StatementCoverage(\'' + fileName + '\',' + injection.statementId + ');\n' +
      contract.slice(injectionPoint);
  };

  injector.eventDefinition = function injectEventDefinition(injectionPoint, injection) {
    contract = contract.slice(0, injectionPoint) +
      'event Coverage(string fileName, uint256 lineNumber);\n' +
      'event FunctionCoverage(string fileName, uint256 fnId);\n' +
      'event StatementCoverage(string fileName, uint256 statementId);\n' +
      'event BranchCoverage(string fileName, uint256 branchId, uint256 locationIdx);\n' +
       contract.slice(injectionPoint);
  };

  // First, we run over the original contract to get the source mapping.
  let result = SolidityParser.parse(contract);
  parse[result.type](result);
  const retValue = {
    contract, runnableLines, fnMap, branchMap, statementMap,
  };

  // Now, we reset almost everything and use the preprocessor first to increase our effectiveness.
  runnableLines = [];
  fnMap = {};
  fnId = 0;
  branchMap = {};
  branchId = 0;
  statementMap = {};
  statementId = 0;
  injectionPoints = {};

  contract = preprocessor.run(contract);
  result = SolidityParser.parse(contract);
  parse[result.type](result);

  // var result = solparse.parse(contract);

  // We have to iterate through these injection points in descending order to not mess up
  // the injection process.
  const sortedPoints = Object.keys(injectionPoints).sort((a, b) => b - a);
  sortedPoints.forEach(injectionPoint => {
    // Line instrumentation has to happen first
    injectionPoints[injectionPoint].sort((a, b) => {
      const eventTypes = ['openParen', 'closeBracketStart', 'callBranchEvent', 'callEmptyBranchEvent', 'callEvent', 'closeBracketEnd'];
      return eventTypes.indexOf(b.type) - eventTypes.indexOf(a.type);
    });
    injectionPoints[injectionPoint].forEach(injection => {
      injector[injection.type](injectionPoint, injection);
    });
  });
  retValue.contract = contract;
  retValue.runnableLines = runnableLines;
  return retValue;
};
