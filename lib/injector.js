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
    return `${this._getMethodIdentifier(id)}(${hash}); /* ${type} */ \n`;
  }

  _getHash(id) {
    this.hashCounter++;
    return web3Utils.keccak256(`${id}:${this.hashCounter}`);
  }

  _getMethodIdentifier(id){
    return `c_${web3Utils.keccak256(id).slice(0,10)}`
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
   * Generates a solidity statement injection. Declared once per fn.
   * Definition is the same for every fn in file.
   * @param  {String} id
   * @return {String}          ex: bytes32[1] memory _sc_82e0891
   */
  _getHashMethodDefinition(id, contract){
    const hash = web3Utils.keccak256(id).slice(0,10);
    const method = this._getMethodIdentifier(id);
    return `\nfunction ${method}(bytes32 c__${hash}) public pure {}\n`;
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

  injectAssertPre(contract, fileName, injectionPoint, injection, instrumentation) {
    const type = 'assertPre';
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

  injectAssertPost(contract, fileName, injectionPoint, injection, instrumentation) {
    const type = 'assertPost';
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
    contract.instrumented = `${start}${this._getHashMethodDefinition(id)}${end}`;
  }
};

module.exports = Injector;
