const assert = require('assert');
const util = require('./../util/util.js');
const Coverage = require('./../../lib/coverage');
const Api = require('./../../lib/api')

describe('asserts and requires', () => {
  let coverage;
  let api;

  before(async () => api = new Api({silent: true}));
  beforeEach(() => coverage = new Coverage());
  after(async() => await api.finish());

  // Assert was covered as a branch up to v0.7.11. But since those
  // conditions are never meant to be fullfilled (and assert is really for smt)
  // people disliked this...
  it('should *not* cover assert statements as branches (pass)', async function() {
    const contract = await util.bootstrapCoverage('assert/Assert', api, this.provider);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(true, contract.gas);
    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {});
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });

  it('should *not* cover assert statements as branches (fail)', async function() {
    const contract = await util.bootstrapCoverage('assert/Assert', api, this.provider);
    coverage.addContract(contract.instrumented, util.filePath);

    try { await contract.instance.a(false, contract.gas) } catch(err) { /* Invalid opcode */ }

    const mapping = coverage.generate(contract.data, util.pathPrefix);
    assert.deepEqual(mapping[util.filePath].l, {
      5: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {});
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });

  it('should cover multi-line require stmts as `if` statements when they pass', async function() {
    const contract = await util.bootstrapCoverage('assert/RequireMultiline', api, this.provider);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(true, true, true, contract.gas);
    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 0],
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });

  it('should cover multi-line require stmts as `if` statements when they fail', async function() {
    const contract = await util.bootstrapCoverage('assert/RequireMultiline', api, this.provider);
    coverage.addContract(contract.instrumented, util.filePath);

    try { await contract.instance.a(true, true, false, contract.gas) } catch(err) { /* Revert */ }

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [0, 1],
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });

  it('should cover require statements with method arguments', async function() {
    const contract = await util.bootstrapCoverage('assert/Require-fn', api, this.provider);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(true, contract.gas);
    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 9: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 0],
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 1
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1, 2: 1
    });
  });

  it('should cover require statements with method arguments & reason string', async function() {
    const contract = await util.bootstrapCoverage('assert/Require-fn-reason', api, this.provider);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(true, contract.gas);
    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 9: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 0],
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 1
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1, 2: 1
    });
  });
});
