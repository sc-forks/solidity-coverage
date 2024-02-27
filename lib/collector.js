/**
 * Writes data from the VM step to the in-memory
 * coverage map constructed by the Instrumenter.
 */
class DataCollector {
  constructor(instrumentationData={}, viaIR){
    this.instrumentationData = instrumentationData;

    this.validOpcodes = {
      "PUSH1": true,
      "DUP1": viaIR,
      "DUP2": viaIR,
      "DUP3": viaIR,
      "DUP4": viaIR,
      "DUP5": viaIR,
      "DUP6": viaIR,
      "DUP7": viaIR,
      "DUP8": viaIR,
      "DUP9": viaIR,
      "DUP10": viaIR,
      "DUP11": viaIR,
      "DUP12": viaIR,
      "DUP13": viaIR,
      "DUP14": viaIR,
      "DUP15": viaIR,
      "DUP16": viaIR,
    }

    this.lastHash = null;
    this.viaIR = viaIR;
    this.pcZeroCounter = 0;
    this.lastPcZeroCount = 0;
  }

  /**
   * VM step event handler. Detects instrumentation hashes when they are pushed to the
   * top of the stack. This runs millions of times - trying to keep it fast.
   * @param  {Object} info  vm step info
   */
  step(info){
    if (info.pc === 0) this.pcZeroCounter++;

    try {
      if (this.validOpcodes[info.opcode.name] && info.stack.length > 0){
        const idx = info.stack.length - 1;
        let hash = '0x' +  info.stack[idx].toString(16);
        this._registerHash(hash);
      }
    } catch (err) { /*Ignore*/ };
  }

  // Temporarily disabled because some relevant traces aren't available
  /**
   * Converts pushData value to string and registers in instrumentation map.
   * @param  {HardhatEVMTraceInstruction} instruction
   */
  /*trackHardhatEVMInstruction(instruction){
    if (instruction && instruction.pushData){
      let hash = `0x` + instruction.pushData.toString('hex');
      this._registerHash(hash)
    }
  }*/

  /**
   * Normalizes has string and marks hit.
   * @param  {String} hash bytes32 hash
   */
  _registerHash(hash){
    hash = this._normalizeHash(hash);

    if(this.instrumentationData[hash]){
      // abi.encode (used to circumvent viaIR) sometimes puts the hash on the stack twice
      // We should only skip duplicate hashes *within* a transaction (see issue #863)
      if (this.lastHash !== hash || this.lastPcZeroCount !== this.pcZeroCounter) {
        this.lastHash = hash;
        this.lastPcZeroCount = this.pcZeroCounter;
        this.instrumentationData[hash].hits++
      }
      return;
    }
  }

  /**
   * Left-pads zero prefixed bytes8 hashes to length 18. The '11' in the
   * comparison below is arbitrary. It provides a margin for recurring zeros
   * but prevents left-padding shorter irrelevant hashes
   *
   * @param  {String} hash  data hash from evm stack.
   * @return {String}       0x prefixed hash of length 18.
   */
  _normalizeHash(hash){
    // viaIR sometimes right-pads the hashes out to 32 bytes
    // but it doesn't preserve leading zeroes when it does this
    if (this.viaIR && hash.length >= 18) {
      hash = hash.slice(0,18);

      // Detect and recover from viaIR mangled hashes by left-padding single `0`
      if(!this.instrumentationData[hash]) {
        hash = hash.slice(2);
        hash = '0' + hash;
        hash = hash.slice(0,16);
        hash = '0x' + hash;
      }

    } else if (hash.length < 18 && hash.length > 11){
      hash = hash.slice(2);
      while(hash.length < 16) hash = '0' + hash;
      hash = '0x' + hash
    }
    return hash;
  }

  /**
   * Unit test helper
   * @param {Object} data  Instrumenter.instrumentationData
   */
  _setInstrumentationData(data){
    this.instrumentationData = data;
  }
}

module.exports = DataCollector;