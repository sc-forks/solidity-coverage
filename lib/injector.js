const web3Utils = require("web3-utils");

class Injector {
  constructor(){
    this.hashCounter = 0;
  }

  _split(contract, injectionPoint){
    return {
      start: contract.instrumented.slice(0, injectionPoint),
      end: contract.instrumented.slice(injectionPoint)
    }
  }

  _getInjectable(id, hash, type){
    switch(type){
      case 'and-true':
        return ` && ${this._getTrueMethodIdentifier(id)}(${hash}))`;
      case 'or-false':
        return ` || ${this._getFalseMethodIdentifier(id)}(${hash}))`;
      default:
        return `${this._getDefaultMethodIdentifier(id)}(${hash}); /* ${type} */ \n`;
    }
  }

  _getHash(id) {
    this.hashCounter++;
    return web3Utils.keccak256(`${id}:${this.hashCounter}`);
  }

  // Method returns void
  _getDefaultMethodIdentifier(id){
    return `c_${web3Utils.keccak256(id).slice(0,10)}`
  }

  // Method returns boolean: true
  _getTrueMethodIdentifier(id){
    return `c_true${web3Utils.keccak256(id).slice(0,10)}`
  }

  // Method returns boolean: false
  _getFalseMethodIdentifier(id){
    return `c_false${web3Utils.keccak256(id).slice(0,10)}`
  }

  _getInjectionComponents(contract, injectionPoint, id, type){
    const { start, end } = this._split(contract, injectionPoint);
    const hash = this._getHash(id)
    const injectable = this._getInjectable(id, hash, type);

    return {
      start: start,
      end: end,
      hash: hash,
      injectable: injectable
    }
  }

  /**
   * Generates an instrumentation fn definition for contract scoped methods.
   * Declared once per contract.
   * @param  {String} id
   * @return {String}
   */
  _getDefaultMethodDefinition(id){
    const hash = web3Utils.keccak256(id).slice(0,10);
    const method = this._getMethodIdentifier(id);
    return `\nfunction ${method}(bytes32 c__${hash}) internal pure {}\n`;
  }

  /**
   * Generates an instrumentation fn definition for file scoped methods.
   * Declared once per file. (Has no visibility modifier)
   * @param  {String} id
   * @return {String}
   */
  _getFileScopedHashMethodDefinition(id, contract){
    const hash = web3Utils.keccak256(id).slice(0,10);
    const method = this._getDefaultMethodIdentifier(id);
    return `\nfunction ${method}(bytes32 c__${hash}) public pure {}\n`;
  }

  /**
   * Generates a solidity statement injection defining a method
   * *which returns boolean true* to pass instrumentation hash to.
   * @param  {String} fileName
   * @return {String}          ex: bytes32[1] memory _sc_82e0891
   */
  _getTrueMethodDefinition(id){
    const hash = web3Utils.keccak256(id).slice(0,10);
    const method = this._getTrueMethodIdentifier(id);
    return `function ${method}(bytes32 c__${hash}) public pure returns (bool){ return true; }\n`;
  }

  /**
   * Generates a solidity statement injection defining a method
   * *which returns boolean false* to pass instrumentation hash to.
   * @param  {String} fileName
   * @return {String}          ex: bytes32[1] memory _sc_82e0891
   */
  _getFalseMethodDefinition(id){
    const hash = web3Utils.keccak256(id).slice(0,10);
    const method = this._getFalseMethodIdentifier(id);
    return `function ${method}(bytes32 c__${hash}) public pure returns (bool){ return false; }\n`;
  }

  injectLine(contract, fileName, injectionPoint, injection, instrumentation){
    const type = 'line';
    const { start, end } = this._split(contract, injectionPoint);
    const id = `${fileName}:${injection.contractName}`;

    const newLines = start.match(/\n/g);
    const linecount = ( newLines || []).length + 1;
    contract.runnableLines.push(linecount);

    const hash = this._getHash(id)
    const injectable = this._getInjectable(id, hash, type);

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
    const id = `${fileName}:${injection.contractName}`;

    const {
      start,
      end,
      hash,
      injectable
    } = this._getInjectionComponents(contract, injectionPoint, id, type);

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
    const id = `${fileName}:${injection.contractName}`;

    const {
      start,
      end,
      hash,
      injectable
    } = this._getInjectionComponents(contract, injectionPoint, id, type);

    instrumentation[hash] = {
      id: injection.fnId,
      type: type,
      contractPath: fileName,
      hits: 0
    }

    contract.instrumented = `${start}${injectable}${end}`;
  }

  injectBranch(contract, fileName, injectionPoint, injection, instrumentation){
    const type = 'branch';
    const id = `${fileName}:${injection.contractName}`;

    const {
      start,
      end,
      hash,
      injectable
    } = this._getInjectionComponents(contract, injectionPoint, id, type);

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
    const id = `${fileName}:${injection.contractName}`;

    const {
      start,
      end,
      hash,
      injectable
    } = this._getInjectionComponents(contract, injectionPoint, id, type);

    instrumentation[hash] = {
      id: injection.branchId,
      locationIdx: injection.locationIdx,
      type: type,
      contractPath: fileName,
      hits: 0
    }

    contract.instrumented = `${start}else { ${injectable}}${end}`;
  }

  injectRequirePre(contract, fileName, injectionPoint, injection, instrumentation) {
    const type = 'requirePre';
    const id = `${fileName}:${injection.contractName}`;

    const {
      start,
      end,
      hash,
      injectable
    } = this._getInjectionComponents(contract, injectionPoint, id, type);

    instrumentation[hash] = {
      id: injection.branchId,
      type: type,
      contractPath: fileName,
      hits: 0
    }

    contract.instrumented = `${start}${injectable}${end}`;
  }

  injectRequirePost(contract, fileName, injectionPoint, injection, instrumentation) {
    const type = 'requirePost';
    const id = `${fileName}:${injection.contractName}`;

    const {
      start,
      end,
      hash,
      injectable
    } = this._getInjectionComponents(contract, injectionPoint, id, type);

    instrumentation[hash] = {
      id: injection.branchId,
      type: type,
      contractPath: fileName,
      hits: 0
    }

    contract.instrumented = `${start}${injectable}${end}`;
  }

  injectHashMethod(contract, fileName, injectionPoint, injection, instrumentation){
    const start = contract.instrumented.slice(0, injectionPoint);
    const end = contract.instrumented.slice(injectionPoint);
    const id = `${fileName}:${injection.contractName}`;

    const defaultMethodDefinition = (injection.isFileScoped)
      ? this._getFileScopedHashMethodDefinition(id)
      : this._getHashMethodDefinition(id);

    contract.instrumented = `${start}` +
                            `${defaultMethodDefinition}` +
                            `${this._getTrueMethodDefinition(id)}` +
                            `${this._getFalseMethodDefinition(id)}` +
                            `${end}`;
  }

  injectOpenParen(contract, fileName, injectionPoint, injection, instrumentation){
    const start = contract.instrumented.slice(0, injectionPoint);
    const end = contract.instrumented.slice(injectionPoint);
    contract.instrumented = `${start}(${end}`;
  }

  injectAndTrue(contract, fileName, injectionPoint, injection, instrumentation){
    const type = 'and-true';
    const id = `${fileName}:${injection.contractName}`;

    const {
      start,
      end,
      hash,
      injectable
    } = this._getInjectionComponents(contract, injectionPoint, id, type);

    instrumentation[hash] = {
      id: injection.branchId,
      locationIdx: injection.locationIdx,
      type: type,
      contractPath: fileName,
      hits: 0
    }

    contract.instrumented = `${start}${injectable}${end}`;
  }

  injectOrFalse(contract, fileName, injectionPoint, injection, instrumentation){
    const type = 'or-false';
    const id = `${fileName}:${injection.contractName}`;

    const {
      start,
      end,
      hash,
      injectable
    } = this._getInjectionComponents(contract, injectionPoint, id, type);

    instrumentation[hash] = {
      id: injection.branchId,
      locationIdx: injection.locationIdx,
      type: type,
      contractPath: fileName,
      hits: 0
    }

    contract.instrumented = `${start}${injectable}${end}`;
  }
};

module.exports = Injector;
