const assert = require('assert');

const util = require('./../util/util.js');
const API = require('./../../api.js');
const utils = require('./../../utils.js');

describe('api', () => {
  let opts;

  beforeEach(() => opts = {silent: true})

  it('getInstrumentationData', function(){
    const api = new API(opts);
    const canonicalPath = 'statements/single.sol'
    const source = util.getCode(canonicalPath);

    api.instrument([{
      source: source,
      canonicalPath: canonicalPath
    }]);

    const data = api.getInstrumentationData();

    const hash = Object.keys(data)[0];
    assert(data[hash].hits === 0);
  });

  it('setInstrumentationData', function(){
    let api = new API(opts);

    const canonicalPath = 'statements/single.sol'
    const source = util.getCode(canonicalPath);

    api.instrument([{
      source: source,
      canonicalPath: canonicalPath
    }]);

    const cloneA = api.getInstrumentationData();
    const hash = Object.keys(cloneA)[0];

    // Verify cloning
    cloneA[hash].hits = 5;
    const cloneB = api.getInstrumentationData();
    assert(cloneB[hash].hits === 0);

    // Verify setting
    api = new API(opts);
    api.instrument([{
      source: source,
      canonicalPath: canonicalPath
    }]);

    api.setInstrumentationData(cloneA);
    const cloneC = api.getInstrumentationData();
    assert(cloneC[hash].hits === 5);
  });

  it('utils', async function(){
    assert(utils.assembleFiles !== undefined)
    assert(utils.checkContext !== undefined)
    assert(utils.finish !== undefined)
    assert(utils.getTempLocations !== undefined)
    assert(utils.setupTempFolders !== undefined)
    assert(utils.loadSource !== undefined)
    assert(utils.loadSolcoverJS !== undefined)
    assert(utils.save !== undefined)
  });
})
