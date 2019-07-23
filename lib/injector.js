const sha1 = require("sha1");
const web3Utils = require("web3-utils");

class Injector {
  constructor(){
    this.hashCounter = 0;
    this.definitionCounter = 0;
  }

  /**
   * Generates solidity statement to inject for line, stmt, branch, fn 'events'
   * @param  {String} memoryVariable
   * @param  {String} hash  hash key to an instrumentationData entry (see _getHash)
   * @param  {String} type  instrumentation type, e.g. line, statement
   * @return {String}       ex: _sc_82e0891[0] = bytes32(0xdc08...08ed1); // function
   */
  _getInjectable(memoryVariable, hash, type){
    return `${memoryVariable}[0] = bytes32(${hash}); /* ${type} */ \n`;
  }


  _getHash(fileName) {
    this.hashCounter++;
    return web3Utils.keccak256(`${fileName}:${this.hashCounter}`);
  }

  /**
   * Generates a solidity statement injection. Declared once per fn.
   * Definition is the same for every fn in file.
   * @param  {String} fileName
   * @return {String}          ex: bytes32[1] memory _sc_82e0891
   */
  _getMemoryVariableDefinition(fileName){
    this.definitionCounter++;
    return `\nbytes32[1] memory _sc_${sha1(fileName).slice(0,7)};\n`;
  }

  _getMemoryVariableAssignment(fileName){
    return `\n_sc_${sha1(fileName).slice(0,7)}`;
  }


  injectLine(contract, fileName, injectionPoint, injection, instrumentation){
    const type = 'line';
    const start = contract.instrumented.slice(0, injectionPoint);
    const end = contract.instrumented.slice(injectionPoint);

    const newLines = start.match(/\n/g);
    const linecount = ( newLines || []).length + 1;
    contract.runnableLines.push(linecount);

    const hash = this._getHash(fileName);
    const memoryVariable = this._getMemoryVariableAssignment(fileName);
    const injectable = this._getInjectable(memoryVariable, hash , type)

    instrumentation[hash] = {
      id: linecount,
      type: type,
      contractPath: fileName,
      hits: 0
    }

    contract.instrumented = `${start}${injectable}${end}`;
  }

  injectStatement(contract, fileName, injectionPoint, injection, instrumentation) {
    const type = 'statement';
    const start = contract.instrumented.slice(0, injectionPoint);
    const end = contract.instrumented.slice(injectionPoint);

    const hash = this._getHash(fileName);
    const memoryVariable = this._getMemoryVariableAssignment(fileName);
    const injectable = this._getInjectable(memoryVariable, hash, type)

    instrumentation[hash] = {
      id: injection.statementId,
      type: type,
      contractPath: fileName,
      hits: 0
    }

    contract.instrumented = `${start}${injectable}${end}`;
  };

  injectFunction(contract, fileName, injectionPoint, injection, instrumentation){
    const type = 'function';
    const start = contract.instrumented.slice(0, injectionPoint);
    const end = contract.instrumented.slice(injectionPoint);

    const hash = this._getHash(fileName);
    const memoryVariableDefinition = this._getMemoryVariableDefinition(fileName);
    const memoryVariable = this._getMemoryVariableAssignment(fileName);
    const injectable = this._getInjectable(memoryVariable, hash, type);

    instrumentation[hash] = {
      id: injection.fnId,
      type: type,
      contractPath: fileName,
      hits: 0
    }

    contract.instrumented = `${start}${memoryVariableDefinition}${injectable}${end}`;
  }

  injectBranch(contract, fileName, injectionPoint, injection, instrumentation){
    const type = 'branch';
    const start = contract.instrumented.slice(0, injectionPoint);
    const end = contract.instrumented.slice(injectionPoint);

    const hash = this._getHash(fileName);
    const memoryVariable = this._getMemoryVariableAssignment(fileName);
    const injectable = this._getInjectable(memoryVariable, hash, type);

    instrumentation[hash] = {
      id: injection.branchId,
      locationIdx: injection.locationIdx,
      type: type,
      contractPath: fileName,
      hits: 0
    }

    contract.instrumented = `${start}${injectable}${end}`;
  }

  injectEmptyBranch(contract, fileName, injectionPoint, injection, instrumentation) {
    const type = 'branch';
    const start = contract.instrumented.slice(0, injectionPoint);
    const end = contract.instrumented.slice(injectionPoint);

    const hash = this._getHash(fileName);
    const memoryVariable = this._getMemoryVariableAssignment(fileName);
    const injectable = this._getInjectable(memoryVariable, hash, type);

    instrumentation[hash] = {
      id: injection.branchId,
      locationIdx: injection.locationIdx,
      type: type,
      contractPath: fileName,
      hits: 0
    }

    contract.instrumented = `${start}else { ${injectable}}${end}`;
  }

  injectAssertPre(contract, fileName, injectionPoint, injection, instrumentation) {
    const type = 'assertPre';
    const start = contract.instrumented.slice(0, injectionPoint);
    const end = contract.instrumented.slice(injectionPoint);

    const hash = this._getHash(fileName);
    const memoryVariable = this._getMemoryVariableAssignment(fileName);
    const injectable = this._getInjectable(memoryVariable, hash, type);

    instrumentation[hash] = {
      id: injection.branchId,
      type: type,
      contractPath: fileName,
      hits: 0
    }

    contract.instrumented = `${start}${injectable}${end}`;
  }

  injectAssertPost(contract, fileName, injectionPoint, injection, instrumentation) {
    const type = 'assertPost';
    const start = contract.instrumented.slice(0, injectionPoint);
    const end = contract.instrumented.slice(injectionPoint);

    const hash = this._getHash(fileName);
    const memoryVariable = this._getMemoryVariableAssignment(fileName);
    const injectable = this._getInjectable(memoryVariable, hash, type);

    instrumentation[hash] = {
      id: injection.branchId,
      type: type,
      contractPath: fileName,
      hits: 0
    }

    contract.instrumented = `${start}${injectable}${end}`;
  }
};

module.exports = Injector;
