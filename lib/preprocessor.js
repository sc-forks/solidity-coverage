const SolExplore = require('sol-explore');
const SolidityParser = require('solidity-parser-antlr');

const crRegex = /[\r\n ]+$/g;
/**
 * Splices enclosing brackets into `contract` around `expression`;
 * @param  {String} contract solidity source
 * @param  {Object} node     AST node to bracket
 * @return {String}          contract
 */
function blockWrap(contract, expression) {
  return contract.slice(0, expression.range[0]) + '{' + contract.slice(expression.range[0], expression.range[1] + 1) + '}' + contract.slice(expression.range[1] + 1);
}

/** Remove 'pure' and 'view' from the function declaration.
 * @param  {String} contract solidity source
 * @param  {Object} function AST node
 * @return {String} contract with the modifiers removed from the given function.
*/
function removePureView(contract, node){
  let fDefStart = node.range[0];
  if (node.body){
    fDefEnd = node.body.range[0];
  } else if (node.returnParameters) {
    fDefEnd = node.returnParameters.range[0];
  } else {
    fDefEnd = node.range[1];
  }
  let fDef = contract.slice(fDefStart, fDefEnd + 1);
  fDef = fDef.replace(/\bview\b/i, '    ');
  fDef = fDef.replace(/\bpure\b/i, '    ');
  return contract.slice(0, fDefStart) + fDef + contract.slice(fDefEnd + 1);
}

/**
 * Locates unbracketed singleton statements attached to if, else, for and while statements
 * and brackets them. Instrumenter needs to inject events at these locations and having
 * them pre-bracketed simplifies the process. Each time a modification is made the contract
 * is passed back to the parser and re-walked because all the starts and ends get shifted.
 *
 * Also removes pure and view modifiers.
 *
 * @param  {String} contract solidity code
 * @return {String}          contract
 */
module.exports.run = function r(contract) {

  try {
    const ast = SolidityParser.parse(contract, { range: true });
    blocksToWrap = [];
    viewPureToRemove = [];
    SolidityParser.visit(ast, {
      IfStatement: function(node) {
        if (node.trueBody.type !== 'Block') {
          blocksToWrap.push(node.trueBody);
        } else if (node.falseBody && node.falseBody.type !== 'Block'){
          blocksToWrap.push(node.falseBody);
        }
      },
      ForStatement: function(node){
        if (node.body.type !== 'Block'){
          blocksToWrap.push(node.body);
        }
      },
      WhileStatement: function(node){
        if (node.body.type !== 'Block'){
          blocksToWrap.push(node.body);
        }
      },
      FunctionDefinition: function(node){
        if (node.stateMutability === 'view' || node.stateMutability === 'pure'){
          viewPureToRemove.push(node);
        }
      }
    })
    // Firstly, remove pures and views. Note that we replace 'pure' and 'view' with spaces, so 
    // character counts remain the same, so we can do this in any order
    viewPureToRemove.forEach(node => contract = removePureView(contract, node));
    // We apply the blocks we found in reverse order to avoid extra characters messing things up.
    blocksToWrap.sort((a,b) => a.range[0] < b.range[0]);
    blocksToWrap.forEach(block => contract = blockWrap(contract, block))
  } catch (err) {
    contract = err;
    keepRunning = false;
  }
  return contract;
};
