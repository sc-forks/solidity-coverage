const SolExplore = require('sol-explore');
const SolidityParser = require('solidity-parser-sc');

/**
 * Splices enclosing brackets into `contract` around `expression`;
 * @param  {String} contract   solidity source
 * @param  {Object} expression AST node to bracket
 * @return {String}            contract
 */
function blockWrap(contract, expression) {
  return contract.slice(0, expression.start) + '{' + contract.slice(expression.start, expression.end) + '}' + contract.slice(expression.end);
}

/**
 * Parses the AST tree to remove pure, constant and view modifiers
 * @param  {Object} ast      AST tree
 * @param  {String} contract solidity code
 * @return {String} contract
 */
function removeViewPureConst(ast, contract) {
  SolExplore.traverse(ast, {
    enter(node, parent) {
      if (node.type === 'FunctionDeclaration' && node.modifiers) {
        // We want to remove constant / pure / view from functions
        for (let i = 0; i < node.modifiers.length; i++) {
          if (['pure', 'constant', 'view'].indexOf(node.modifiers[i].name) > -1) {
            contract = contract.slice(0, node.modifiers[i].start) +
              ' '.repeat(node.modifiers[i].end - node.modifiers[i].start) +
              contract.slice(node.modifiers[i].end);
          }
        }
      }
    },
  });
  return contract;
}

/**
 * Parses the AST tree to locate unbracketed singleton statements attached to if, else, for and while statements
 * and brackets them
 * @param  {Object} ast      AST tree product of SolidityParser
 * @param  {String} contract solidity code
 * @return {String} contract
 */
function bracketUnbStatements(ast, contract) {
  const brkList = [];
  let offset = 0;
  SolExplore.traverse(ast, {
    enter(node, parent) { // eslint-disable-line no-loop-func
      // If consequents
      if (node.type === 'IfStatement' && node.consequent.type !== 'BlockStatement') {
        brkList.push({
          start: node.consequent.start, end: node.consequent.end,
        });
        // If alternates
      } else if (
        node.type === 'IfStatement' &&
        node.alternate &&
        node.alternate.type !== 'BlockStatement') {
        brkList.push({
          start: node.alternate.start, end: node.alternate.end,
        });
        // Loops
      } else if (
        (node.type === 'ForStatement' || node.type === 'WhileStatement') &&
        node.body.type !== 'BlockStatement') {
        brkList.push({
          start: node.body.start, end: node.body.end,
        });
      }
    },
  });
  brkList.sort((a, b) => {
    if (a.start < b.start) {
      return -1;
    }
    if (a.start > b.start) {
      return 1;
    }
    return 0;
  });
  for (let i = 0; i < brkList.length; i++) {
    let check = null;
    if (i > 0 && i < brkList.length - 1) {
      check =
        brkList[i].end >= brkList[i + 1].end ||
        brkList[i].end <= brkList[i - 1].end;
      if (i > 1) {
        check = check || brkList[i].end <= brkList[i - 2].end;
      }
    } else if (i === 0) {
      check = brkList[i].end >= brkList[i + 1].end;
    } else if (i === brkList.length - 1) {
      check = brkList[i].end <= brkList[i - 1].end;
    }
    brkList[i].nested = check;
    const elem = Object.assign(brkList[i]);
    elem.start += offset;
    elem.end += offset;
    contract = blockWrap(contract, elem);
    offset += 2;
  }
  return contract;
}

/**
 * Locates unbracketed singleton statements attached to if, else, for and while statements
 * and brackets them. Instrumenter needs to inject events at these locations and having
 * them pre-bracketed simplifies the process. The process is broken down to 3 stages:
 *   1. Parse the contract to get the AST tree
 *   2. Remove all the view, pure and constant modifiers
 *   3. Bracket all related unbracketed singleton statements
 * @param  {String} contract solidity code
 * @return {String} contract
 */
module.exports.run = function r(contract) {
  try {
    const ast = SolidityParser.parse(contract);
    contract = removeViewPureConst(ast, contract);
    contract = bracketUnbStatements(ast, contract);
  } catch (err) {
    contract = err;
  }
  return contract;
};
