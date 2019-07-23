const web3Utils = require('web3-utils')

class DataCollector {
  constructor(config={}, instrumentationData={}){
    this.instrumentationData = instrumentationData;

    this.vm = config.vmResolver
      ? config.vmResolver(config.provider)
      : this._ganacheVMResolver(config.provider);

    this._connect();
  }

  // Subscribes to vm.on('step').
  _connect(){
    const self = this;
    this.vm.on("step", function(info){

      if (info.opcode.name.includes("PUSH") && info.stack.length > 0){
        const idx = info.stack.length - 1;
        const hash = web3Utils.toHex(info.stack[idx]).toString();

        if(self.instrumentationData[hash]){
          self.instrumentationData[hash].hits++;
        }
      }
    })
  }

  _ganacheVMResolver(provider){
    return provider.engine.manager.state.blockchain.vm;
  }

  _setInstrumentationData(data){
    this.instrumentationData = data;
  }
}

module.exports = DataCollector;
