const web3Utils = require('web3-utils')

/**
 * Writes data from the VM step to the in-memory
 * coverage map constructed by the Instrumenter.
 */
class DataCollector {
  constructor(instrumentationData={}){
    this.instrumentationData = instrumentationData;

    this.validOpcodes = {
      "PUSH1": true,
    }
  }

  /**
   * VM step event handler. Detects instrumentation hashes when they are pushed to the
   * top of the stack. This runs millions of times - trying to keep it fast.
   * @param  {Object} info  vm step info
   */
  step(info){
    try {
      if (this.validOpcodes[info.opcode.name] && info.stack.length > 0){
        const idx = info.stack.length - 1;
        let hash = web3Utils.toHex(info.stack[idx]).toString();
        hash = this._normalizeHash(hash);

        if(this.instrumentationData[hash]){
          this.instrumentationData[hash].hits++;
        }
      }
    } catch (err) { /*Ignore*/ };
  }

  /**
   * Left-pads zero prefixed bytes 32 hashes to length 66. The '59' in the
   * comparison below is arbitrary. It provides a margin for recurring zeros
   * but prevents left-padding shorter irrelevant hashes (like fn sigs)
   *
   * @param  {String} hash  data hash from evm stack.
   * @return {String}       0x prefixed hash of length 66.
   */
  _normalizeHash(hash){
    if (hash.length < 66 && hash.length > 59){
      hash = hash.slice(2);
      while(hash.length < 64) hash = '0' + hash;
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