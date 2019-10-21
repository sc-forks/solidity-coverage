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
        let hash = "0x" + info.stack[idx].toString(16,64);
        if(this.instrumentationData[hash]){
          this.instrumentationData[hash].hits++;
        }
      }
    } catch (err) { /*Ignore*/ };
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
