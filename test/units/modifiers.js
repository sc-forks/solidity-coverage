const assert = require('assert');
const util = require('./../util/util.js');

const client = require('ganache-cli');
const Coverage = require('./../../lib/coverage');
const Api = require('./../../lib/api')

describe('modifiers', () => {
  let coverage;
  let api;

  before(async () => {
    api = new Api({silent: true});
    await api.ganache(client);
  })
  beforeEach(() => coverage = new Coverage());
  after(async() => await api.finish());

  async function setupAndRun(solidityFile){
    const contract = await util.bootstrapCoverage(solidityFile, api);
    coverage.addContract(contract.instrumented, util.filePath);

    /* some modifiers intentionally fail */
    try {
      await contract.instance.a();
    } catch(e){}

    return coverage.generate(contract.data, util.pathPrefix);
  }

  it('should cover a modifier branch which always succeeds', async function() {
    const mapping = await setupAndRun('modifiers/same-contract-pass');

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 6: 1, 10: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 0], 2: [1, 0]
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 1,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1, 2: 1
    });
  });

  // NB: Failures are replayed by truffle-contract
  it('should cover a modifier branch which never succeeds', async function() {
    const mapping = await setupAndRun('modifiers/same-contract-fail');

    assert.deepEqual(mapping[util.filePath].l, {
      5: 2, 6: 0, 10: 0,
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [0, 2], 2: [0, 2]
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 2, 2: 0,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 2, 2: 0
    });
  });

  it('should cover a modifier on an overridden function', async function() {
    const mapping = await setupAndRun('modifiers/override-function');

    assert.deepEqual(mapping[util.filePath].l, {
      9: 1, 10: 1, 14: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 0], 2: [1, 0]
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 1
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1, 2: 1
    });
  });

  it('should cover multiple modifiers on the same function', async function() {
    const mapping = await setupAndRun('modifiers/multiple-mods-same-fn');

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 6: 1, 10: 1, 11: 1, 15: 1
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 0], 2: [1, 0], 3: [1, 0], 4: [1, 0]
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 1, 3: 1
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1, 2: 1, 3: 1
    });
  });

  it('should cover multiple functions which use the same modifier', async function() {
    const contract = await util.bootstrapCoverage('modifiers/multiple-fns-same-mod', api);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a();
    await contract.instance.b();
    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 2, 6: 2, 10: 1, 14: 1
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [2, 0], 2: [1, 0], 3: [1, 0]
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 2, 2: 1, 3: 1,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 2, 2: 1, 3: 1
    });
  });

  it('should cover when both modifier branches are hit', async function() {
    const contract = await util.bootstrapCoverage('modifiers/both-branches', api);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a();
    await contract.instance.flip();

    try {
      await contract.instance.a();
    } catch(e) { /*ignore*/ }

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      7: 3, 8: 1, 12: 1, 16: 1
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 2], 2: [1, 2],
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 3, 2: 1, 3: 1,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 3, 2: 1, 3: 1
    });
  });

  it('should cover when modifiers are listed with newlines', async function() {
    const mapping = await setupAndRun('modifiers/listed-modifiers');

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 6: 1, 10: 1, 11: 1, 19: 1
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 0], 2: [1, 0], 3: [1, 0], 4: [1, 0]
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 1, 3: 1,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1, 2: 1, 3: 1
    });
  });
});
