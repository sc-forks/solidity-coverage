const assert = require('assert');
const util = require('./../util/util.js');
const Coverage = require('./../../lib/coverage');
const Api = require('./../../lib/api')

describe.only('try / catch branches', () => {
  let coverage;
  let api;

  before(async () => api = new Api({silent: true}));
  beforeEach(() => coverage = new Coverage());
  after(async() => await api.finish());

  it('should cover a try/catch statement with empty blocks (success branch only)', async function() {
    const contract = await util.bootstrapCoverage('try/try-catch-empty-blocks', api, this.provider, );
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(true, contract.gas);
    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5:1,9:1
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1:[1,0]
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1:1,2:1
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1:1,2:1
    });
  });

  it('should cover a try/catch statement with empty blocks (both branches)', async function() {
    const contract = await util.bootstrapCoverage('try/try-catch-empty-blocks', api, this.provider, );
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(true, contract.gas);

    try { await contract.instance.a(false, contract.gas) } catch(err) { /* ignore */ }

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5:2,9:2
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1:[1,1]
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1:2,2:2
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1:2,2:2
    });
  });

  it('should cover a try/catch statement with an Error block (success branch only)', async function() {
    const contract = await util.bootstrapCoverage('try/try-error-block', api, this.provider, );
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(true, contract.gas);

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5:1,6:1,10:1,11:1,13:0
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1:[1,0]
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1:1,2:1,3:1,4:1,5:0
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1:1,2:1
    });
  });

  it('should cover a try/catch statement with an Error block (both branches)', async function() {
    const contract = await util.bootstrapCoverage('try/try-error-block', api, this.provider, );
    coverage.addContract(contract.instrumented, util.filePath);

    await contract.instance.a(true, contract.gas);
    try { await contract.instance.a(false, contract.gas) } catch(err) { /* ignore */ }

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5:2,6:1,10:2,11:1,13:1
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1:[1,1]
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1:2,2:1,3:2,4:1,5:1
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1:2,2:2
    });
  });

  it('should cover a try/catch statement with multi-block catch clauses (middle-block)', async function() {
    const contract = await util.bootstrapCoverage('try/try-multi-block', api, this.provider, );
    coverage.addContract(contract.instrumented, util.filePath);

    await contract.instance.a(0, contract.gas);
    try { await contract.instance.a(2, contract.gas) } catch(err) { /* ignore */ }

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5:2,6:2,8:2,9:1,10:1,11:0,12:1,13:1,14:0,15:0,19:2,20:1,22:0,24:1,26:0
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1:[1,1],2:[0,1],3:[0,0],4:[1,0],5:[0,0]
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1:2,2:2,3:2,4:1,5:1,6:0,7:1,8:1,9:0,10:0,11:2,12:1,13:0,14:1,15:0
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1:2,2:2
    });
  });
});