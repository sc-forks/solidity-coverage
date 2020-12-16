const web3Utils = require("web3-utils");

class Injector {
  constructor(){
    this.hashCounter = 0;
    this.modifiers = {};
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
      case 'modifier':
        return ` ${this._getModifierIdentifier(id)} `;
      default:
        return `${this._getDefaultMethodIdentifier(id)}(${hash}); /* ${type} */ \n`;
    }
  }

  _getHash(id) {
    this.hashCounter++;
    return web3Utils.keccak256(`${id}:${this.hashCounter}`).slice(0,18);
  }

  // Method returns void
  _getDefaultMethodIdentifier(id){
    return `c_${web3Utils.keccak256(id).slice(2,10)}`
  }

  // Method returns boolean: true
  _getTrueMethodIdentifier(id){
    return `c_true${web3Utils.keccak256(id).slice(2,10)}`
  }

  // Method returns boolean: false
  _getFalseMethodIdentifier(id){
    return `c_false${web3Utils.keccak256(id).slice(2,10)}`
  }

  _getModifierIdentifier(id){
    return `c_mod${web3Utils.keccak256(id).slice(2,10)}`
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
   * Generates a solidity statement injection defining a method
   * *which returns void* to pass instrumentation hash to.
   * @param  {String} id
   * @return {String}          ex: bytes32[1] memory _sc_82e0891
   */
  _getDefaultMethodDefinition(id){
    const hash = web3Utils.keccak256(id).slice(2,10);
    const method = this._getDefaultMethodIdentifier(id);
    return `\nfunction ${method}(bytes8 c__${hash}) public pure {}\n`;
  }

  /**
   * Generates a solidity statement injection defining a method
   * *which returns boolean true* to pass instrumentation hash to.
   * @param  {String} fileName
   * @return {String}          ex: bytes32[1] memory _sc_82e0891
   */
  _getTrueMethodDefinition(id){
    const hash = web3Utils.keccak256(id).slice(2,10);
    const method = this._getTrueMethodIdentifier(id);
    return `function ${method}(bytes8 c__${hash}) public pure returns (bool){ return true; }\n`;
  }

  /**
   * Generates a solidity statement injection defining a method
   * *which returns boolean false* to pass instrumentation hash to.
   * @param  {String} fileName
   * @return {String}          ex: bytes32[1] memory _sc_82e0891
   */
  _getFalseMethodDefinition(id){
    const hash = web3Utils.keccak256(id).slice(2,10);
    const method = this._getFalseMethodIdentifier(id);
    return `function ${method}(bytes8 c__${hash}) public pure returns (bool){ return false; }\n`;
  }

  _getModifierDefinitions(contractId, instrumentation){
    let injection = '';

    if (this.modifiers[contractId]){

      for (const item of this.modifiers[contractId]){
        injection += `modifier ${this._getModifierIdentifier(item.modifierId)}{ `;

        let hash = this._getHash(item.modifierId);
        let injectable = this._getInjectable(item.contractId, hash, 'modifier-pre');

        instrumentation[hash] = {
          id: item.branchId,
          type: 'requirePre',
          contractPath: item.fileName,
          hits: 0
        }

        injection += injectable;
        injection += `_;`

        hash = this._getHash(item.modifierId);
        injectable = this._getInjectable(item.contractId, hash, 'modifier-post');

        instrumentation[hash] = {
          id: item.branchId,
          type: 'requirePost',
          contractPath: item.fileName,
          hits: 0
        }

        injection += injectable;
        injection += ` }\n`;
      }
    }

    return injection;
  }

  _cacheModifier(injection){
    if (!this.modifiers[injection.contractId]) {
      this.modifiers[injection.contractId] = [];
    }

    this.modifiers[injection.contractId].push(injection);
  }

  resetModifierMapping(){
    this.modifiers = {};
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
    contract.instrumented = `${start}` +
                            `${this._getDefaultMethodDefinition(id)}` +
                            `${this._getTrueMethodDefinition(id)}` +
                            `${this._getFalseMethodDefinition(id)}` +
                            `${this._getModifierDefinitions(id, instrumentation)}` +
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

  injectModifier(contract, fileName, injectionPoint, injection, instrumentation){
    const type = 'modifier';
    const contractId = `${fileName}:${injection.contractName}`;
    const modifierId = `${fileName}:${injection.contractName}:` +
                       `${injection.modifierName}:${injection.fnId}`;

    const {
      start,
      end,
      hash,
      injectable
    } = this._getInjectionComponents(contract, injectionPoint, modifierId, type);

    this._cacheModifier({
      contractId,
      modifierId,
      fileName,
      ...injection
    });

    contract.instrumented = `${start}${injectable}${end}`;
  }
};

module.exports = Injector;
