const assert = require('assert');
const util = require('./../util/util.js');

const ganache = require('ganache-core-sc');
const Coverage = require('./../../lib/coverage');

describe('asserts and requires', () => {
  let coverage;
  let provider;
  let collector;

  before(() => ({ provider, collector } = util.initializeProvider(ganache)));
  beforeEach(() => coverage = new Coverage());
  after((done) => provider.close(done));

  it('should cover assert statements as `if` statements when they pass', async function() {
    const contract = await util.bootstrapCoverage('assert/Assert', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(true);
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

  // NB: Truffle replays failing txs as .calls to obtain the revert reason from the return
  // data. Hence the 2X measurements.
  it('should cover assert statements as `if` statements when they fail', async function() {
    const contract = await util.bootstrapCoverage('assert/Assert', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);

    try { await contract.instance.a(false) } catch(err) { /* Invalid opcode */ }

    const mapping = coverage.generate(contract.data, util.pathPrefix);
    assert.deepEqual(mapping[util.filePath].l, {
      5: 2,
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [0, 2],
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 2,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 2,
    });
  });

  it('should cover multi-line require stmts as `if` statements when they pass', async function() {
    const contract = await util.bootstrapCoverage('assert/RequireMultiline', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(true, true, true);
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

  // NB: Truffle replays failing txs as .calls to obtain the revert reason from the return
  // data. Hence the 2X measurements.
  it('should cover multi-line require stmts as `if` statements when they fail', async function() {
    const contract = await util.bootstrapCoverage('assert/RequireMultiline', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);

    try { await contract.instance.a(true, true, false) } catch(err) { /* Revert */ }

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 2,
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [0, 2],
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 2,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 2,
    });
  });
});
