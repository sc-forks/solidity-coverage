const SolExplore = require('sol-explore');
const SolidityParser = require('solidity-parser');

/**
 * Splices enclosing brackets into `contract` around `expression`;
 * @param  {String} contract solidity code
 * @param  {Object} node     AST node to bracket
 * @return {String}          contract
 */
function blockWrap(contract, expression) {
  return contract.slice(0, expression.start) + '{' + contract.slice(expression.start, expression.end) + '}' + contract.slice(expression.end);
}

/**
 * Locates unbracketed singleton statements attached to if, else, for and while statements
 * and brackets them. Instrumenter needs to inject events at these locations and having
 * them pre-bracketed simplifies the process. Each time a modification is made the contract
 * is passed back to the parser and re-walked because all the starts and ends get shifted.
 * @param  {String} contract solidity code
 * @return {String}          contract
 */
module.exports.run = function r(contract) {
  let keepRunning = true;

  while (keepRunning) {
    const ast = SolidityParser.parse(contract);
    keepRunning = false;
    SolExplore.traverse(ast, {
      enter(node, parent) { // eslint-disable-line no-loop-func
        // If consequents
        if (node.type === 'IfStatement' && node.consequent.type !== 'BlockStatement') {
          contract = blockWrap(contract, node.consequent);
          keepRunning = true;
          this.stopTraversal();
        // If alternates
        } else if (
            node.type === 'IfStatement' &&
            node.alternate &&
            node.alternate.type !== 'BlockStatement') {
          contract = blockWrap(contract, node.alternate);
          keepRunning = true;
          this.stopTraversal();
        // Loops
        } else if (
            (node.type === 'ForStatement' || node.type === 'WhileStatement') &&
            node.body.type !== 'BlockStatement') {
          contract = blockWrap(contract, node.body);
          keepRunning = true;
          this.stopTraversal();
        }
      },
    });
  }
  return contract;
};
