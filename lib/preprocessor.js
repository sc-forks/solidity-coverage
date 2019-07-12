const SolExplore = require('sol-explore');
const SolidityParser = require('solidity-parser-antlr');

const crRegex = /[\r\n ]+$/g;
const OPEN = '{';
const CLOSE = '}';

/**
 * Splices enclosing brackets into `contract` around `expression`;
 * @param  {String} contract solidity source
 * @param  {Object} node     AST node to bracket
 * @return {String}          contract
 */
function insertBrace(contract, item, offset) {
  return contract.slice(0,item.pos + offset) + item.type + contract.slice(item.pos + offset)
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
    insertions = [];
    viewPureToRemove = [];
    SolidityParser.visit(ast, {
      IfStatement: function(node) {
        if (node.trueBody.type !== 'Block') {
          insertions.push({type: OPEN, pos: node.trueBody.range[0]});
          insertions.push({type: CLOSE, pos: node.trueBody.range[1] + 1});
        }
        if ( node.falseBody && node.falseBody.type !== 'Block' ) {
          insertions.push({type: OPEN, pos: node.falseBody.range[0]});
          insertions.push({type: CLOSE, pos: node.falseBody.range[1] + 1});
        }
      },
      ForStatement: function(node){
        if (node.body.type !== 'Block'){
          insertions.push({type: OPEN, pos: node.body.range[0]});
          insertions.push({type: CLOSE, pos: node.body.range[1] + 1});
        }
      },
      WhileStatement: function(node){
        if (node.body.type !== 'Block'){
          insertions.push({type: OPEN, pos: node.body.range[0]});
          insertions.push({type: CLOSE, pos: node.body.range[1] + 1});
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
    // Sort the insertion points.
    insertions.sort((a,b) => a.pos - b.pos);
    insertions.forEach((item, idx) => contract = insertBrace(contract, item, idx));

  } catch (err) {
    contract = err;
    keepRunning = false;
  }
  return contract;
};
