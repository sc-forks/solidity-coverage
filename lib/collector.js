const web3Utils = require('web3-utils')

class DataCollector {
  constructor(instrumentationData={}){
    this.instrumentationData = instrumentationData;

    this.validOpcodes = {
      "PUSH1": true,
    }
  }

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

  _setInstrumentationData(data){
    this.instrumentationData = data;
  }

  _normalizeHash(hash){
    if (hash.length < 66 && hash.length > 52){
      hash = hash.slice(2);
      while(hash.length < 64) hash = '0' + hash;
      hash = '0x' + hash
    }
    return hash;
  }
}

module.exports = DataCollector;
