const instrumenter = {};

// These functions work out where in an expression we can inject our
// instrumenation events.

function createOrAppendInjectionPoint(contract, key, value) {
  if (contract.injectionPoints[key]) {
    contract.injectionPoints[key].push(value);
  } else {
    contract.injectionPoints[key] = [value];
  }
}

instrumenter.prePosition = function prePosition(expression) {
  if (expression.right.type === 'ConditionalExpression' &&
      expression.left.type === 'MemberExpression') {
    expression.start -= 2;
  }
};

instrumenter.instrumentAssignmentExpression = function instrumentAssignmentExpression(contract, expression) {
  // The only time we instrument an assignment expression is if there's a conditional expression on
  // the right
  if (expression.right.type === 'ConditionalExpression') {
    if (expression.left.type === 'DeclarativeExpression' || expression.left.type === 'Identifier') {
      // Then we need to go from bytes32 varname = (conditional expression)
      // to             bytes32 varname; (,varname) = (conditional expression)
      createOrAppendInjectionPoint(contract, expression.left.end, {
        type: 'literal', string: '; (,' + expression.left.name + ')',
      });
      instrumenter.instrumentConditionalExpression(contract, expression.right);
    } else if (expression.left.type === 'MemberExpression') {
      createOrAppendInjectionPoint(contract, expression.left.start, {
        type: 'literal', string: '(,',
      });
      createOrAppendInjectionPoint(contract, expression.left.end, {
        type: 'literal', string: ')',
      });
      instrumenter.instrumentConditionalExpression(contract, expression.right);
    } else {
      const err = 'Error instrumenting assignment expression @ solidity-coverage/lib/instrumenter.js';
      console.log(err, contract, expression.left);
      process.exit();
    }
  }
};

instrumenter.instrumentConditionalExpression = function instrumentConditionalExpression(contract, expression) {
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
};

instrumenter.instrumentStatement = function instrumentStatement(contract, expression) {
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
};

instrumenter.instrumentLine = function instrumentLine(contract, expression) {
  // what's the position of the most recent newline?
  const startchar = expression.start;
  const endchar = expression.end;
  const lastNewLine = contract.instrumented.slice(0, startchar).lastIndexOf('\n');
  const nextNewLine = startchar + contract.instrumented.slice(startchar).indexOf('\n');
  const contractSnipped = contract.instrumented.slice(lastNewLine, nextNewLine);
  const restOfLine = contract.instrumented.slice(endchar, nextNewLine);

  if (contract.instrumented.slice(lastNewLine, startchar).trim().length === 0 &&
      (restOfLine.replace(';', '').trim().length === 0 || restOfLine.replace(';', '').trim().substring(0, 2) === '//')) {
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
};

instrumenter.instrumentFunctionDeclaration = function instrumentFunctionDeclaration(contract, expression) {
  contract.fnId += 1;
  const startline = (contract.instrumented.slice(0, expression.start).match(/\n/g) || []).length + 1;
  // We need to work out the lines and columns the function declaration starts and ends
  const startcol = expression.start - contract.instrumented.slice(0, expression.start).lastIndexOf('\n') - 1;
  const endlineDelta = contract.instrumented.slice(expression.start).indexOf('{');
  const functionDefinition = contract.instrumented.slice(expression.start, expression.start + endlineDelta);
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
  createOrAppendInjectionPoint(contract, expression.start + endlineDelta + 1, {
    type: 'callFunctionEvent', fnId: contract.fnId,
  });
};

instrumenter.addNewBranch = function addNewBranch(contract, expression) {
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
};

instrumenter.instrumentAssertOrRequire = function instrumentAssertOrRequire(contract, expression) {
  instrumenter.addNewBranch(contract, expression);
  createOrAppendInjectionPoint(contract, expression.start, {
    type: 'callAssertPreEvent', branchId: contract.branchId,
  });
  createOrAppendInjectionPoint(contract, expression.end + 1, {
    type: 'callAssertPostEvent', branchId: contract.branchId,
  });
};

instrumenter.instrumentIfStatement = function instrumentIfStatement(contract, expression) {
  instrumenter.addNewBranch(contract, expression);
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
};

module.exports = instrumenter;
