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

  _getInjectable(fileName, hash, type){
    switch(type){
      case 'logicalOR':
        return ` && ${this._getTrueMethodIdentifier(fileName)}(${hash}))`;
      default:
        return `${this._getDefaultMethodIdentifier(fileName)}(${hash}); /* ${type} */ \n`;
    }
  }

  _getHash(fileName) {
    this.hashCounter++;
    return web3Utils.keccak256(`${fileName}:${this.hashCounter}`);
  }

  // Method returns void
  _getDefaultMethodIdentifier(fileName){
    return `coverage_${web3Utils.keccak256(fileName).slice(0,10)}`
  }

  // Method returns boolean true
  _getTrueMethodIdentifier(fileName){
    return `coverage_true${web3Utils.keccak256(fileName).slice(0,10)}`
  }

  _getInjectionComponents(contract, injectionPoint, fileName, type){
    const { start, end } = this._split(contract, injectionPoint);
    const hash = this._getHash(fileName)
    const injectable = this._getInjectable(fileName, hash, type);

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
   * @param  {String} fileName
   * @return {String}          ex: bytes32[1] memory _sc_82e0891
   */
  _getDefaultMethodDefinition(fileName){
    const hash = web3Utils.keccak256(fileName).slice(0,10);
    const method = this._getDefaultMethodIdentifier(fileName);
    return `\nfunction ${method}(bytes32 c__${hash}) public pure {}\n`;
  }

  /**
   * Generates a solidity statement injection defining a method
   * *which returns boolean true* to pass instrumentation hash to.
   * @param  {String} fileName
   * @return {String}          ex: bytes32[1] memory _sc_82e0891
   */
  _getTrueMethodDefinition(fileName){
    const hash = web3Utils.keccak256(fileName).slice(0,10);
    const method = this._getTrueMethodIdentifier(fileName);
    return `\nfunction ${method}(bytes32 c__${hash}) public pure returns (bool){ return true; }\n`;
  }

  injectLine(contract, fileName, injectionPoint, injection, instrumentation){
    const type = 'line';
    const { start, end } = this._split(contract, injectionPoint);

    const newLines = start.match(/\n/g);
    const linecount = ( newLines || []).length + 1;
    contract.runnableLines.push(linecount);

    const hash = this._getHash(fileName)
    const injectable = this._getInjectable(fileName, hash, type);

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

    const {
      start,
      end,
      hash,
      injectable
    } = this._getInjectionComponents(contract, injectionPoint, fileName, type);

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

    const {
      start,
      end,
      hash,
      injectable
    } = this._getInjectionComponents(contract, injectionPoint, fileName, type);

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

    const {
      start,
      end,
      hash,
      injectable
    } = this._getInjectionComponents(contract, injectionPoint, fileName, type);

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

    const {
      start,
      end,
      hash,
      injectable
    } = this._getInjectionComponents(contract, injectionPoint, fileName, type);

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

    const {
      start,
      end,
      hash,
      injectable
    } = this._getInjectionComponents(contract, injectionPoint, fileName, type);

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

    const {
      start,
      end,
      hash,
      injectable
    } = this._getInjectionComponents(contract, injectionPoint, fileName, type);

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
    contract.instrumented = `${start}` +
                            `${this._getDefaultMethodDefinition(fileName)}` +
                            `${this._getTrueMethodDefinition(fileName)}` +
                            `${end}`;
  }

  injectOpenParen(contract, fileName, injectionPoint, injection, instrumentation){
    const start = contract.instrumented.slice(0, injectionPoint);
    const end = contract.instrumented.slice(injectionPoint);
    contract.instrumented = `${start}(${end}`;
  }

  injectLogicalOR(contract, fileName, injectionPoint, injection, instrumentation){
    const type = 'logicalOR';

    const {
      start,
      end,
      hash,
      injectable
    } = this._getInjectionComponents(contract, injectionPoint, fileName, type);

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
