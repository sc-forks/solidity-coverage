const web3Utils = require('web3-utils')

class DataCollector {
  constructor(instrumentationData={}){
    this.instrumentationData = instrumentationData;
  }

  step(info){
    const self = this;
    if (typeof info !== 'object' || !info.opcode ) return;

    if (info.opcode.name.includes("PUSH1") && info.stack.length > 0){
      const idx = info.stack.length - 1;
      let hash = web3Utils.toHex(info.stack[idx]).toString();
      hash = self._normalizeHash(hash);

      if(self.instrumentationData[hash]){
        self.instrumentationData[hash].hits++;
      }
    }
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
