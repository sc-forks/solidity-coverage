const assert = require('assert');
const util = require('./../util/util.js');

const ganache = require('ganache-core-sc');
const Coverage = require('./../../lib/coverage');

describe('logical OR branches', () => {
  let coverage;
  let provider;
  let collector;

  before(async () => ({ provider, collector } = await util.initializeProvider(ganache)));
  beforeEach(() => coverage = new Coverage());
  after((done) => provider.close(done));

  // if (x == 1 || x == 2) { } else ...
  it('should cover an if statement with a simple OR condition (single branch)', async function() {
    const contract = await util.bootstrapCoverage('or/if-or', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(1);
    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 8: 0
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 0],
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 0,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });

  // if (x == 1 || x == 2) { } else ...
  it('should cover an if statement with a simple OR condition (both branches)', async function() {
    const contract = await util.bootstrapCoverage('or/if-or', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(1);
    await contract.instance.a(2);

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 2, 8: 0
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [2, 0],
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 2, 2: 0,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 2,
    });
  });

  // require(x == 1 || x == 2)
  it('should cover a require statement with a simple OR condition (single branch)', async function() {
    const contract = await util.bootstrapCoverage('or/require-or', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(1);

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 0], 2: [1, 0]
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });

  // require(x == 1 || x == 2)
  it('should cover a require statement with a simple OR condition (both branches)', async function() {
    const contract = await util.bootstrapCoverage('or/require-or', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(1);
    await contract.instance.a(2);

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 2,
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [2, 0], 2: [1, 1]
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 2,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 2,
    });
  });

  // while( (x == 1 || x == 2) && counter < 2 ){
  it('should cover a while statement with a simple OR condition (single branch)', async function() {
    const contract = await util.bootstrapCoverage('or/while-or', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(1);

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 6: 1, 7: 2
    });
    assert.deepEqual(mapping[util.filePath].b, {

    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 1
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });

  // while( (x == 1 || x == 2) && counter < 2 ){
  it('should cover a while statement with a simple OR condition (both branches)', async function() {
    const contract = await util.bootstrapCoverage('or/while-or', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(1);
    await contract.instance.a(2);

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 2, 6: 2, 7: 4
    });
    assert.deepEqual(mapping[util.filePath].b, {

    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 2, 2: 2
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 2,
    });
  });

  // return (x == 1 && true) || (x == 2 && true);
  it('should cover a return statement with ANDED OR conditions (single branch)', async function() {
    const contract = await util.bootstrapCoverage('or/return-or', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(1);

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {

    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });

  // return (x == 1 && true) || (x == 2 && true);
  it('should cover a return statement with ANDED OR conditions (both branches)', async function() {
    const contract = await util.bootstrapCoverage('or/return-or', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(1);
    await contract.instance.a(2);

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 2,
    });
    assert.deepEqual(mapping[util.filePath].b, {

    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 2,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 2,
    });
  });

  //if (x == 1 && true || x == 2) {
  it('should cover an if statement with OR and AND conditions (single branch)', async function() {
    const contract = await util.bootstrapCoverage('or/and-or', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(1);

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 8: 0
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 0],
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 0,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });

  //if (x == 1 && true || x == 2) {
  it('should cover an if statement with OR and AND conditions (both branches)', async function() {
    const contract = await util.bootstrapCoverage('or/and-or', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(1);
    await contract.instance.a(2);

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 2, 8: 0
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [2, 0],
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 2, 2: 0,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 2,
    });
  });

  // if ((x == 1) && (x == 2 || true)) {
  it('should cover an if statement with bracked ANDED OR and AND conditions (both branches)', async function() {
    const contract = await util.bootstrapCoverage('or/and-or-brackets', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(1);

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 8: 0
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 0],
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 0,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });

  // if ((x == 1) || (x == 2 || true)) {
  it('should cover an if statement with multiple (bracketed) OR conditions (branch 1)', async function() {
    const contract = await util.bootstrapCoverage('or/multi-or', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(1);

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 8: 0
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 0],
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 0,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });

  // if ((x == 1) || (x == 2 || true)) {
  it('should cover an if statement with multiple (bracketed) OR conditions (branch 2)', async function() {
    const contract = await util.bootstrapCoverage('or/multi-or', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(2);

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 8: 0
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 0],
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 0,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });

  // if ((x == 1) || (x == 2 || true)) {
  it('should cover an if statement with multiple (bracketed) OR conditions (branch 3)', async function() {
    const contract = await util.bootstrapCoverage('or/multi-or', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(3);

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 8: 0
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 0],
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 0,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });

  it('should cover the bzx example', async function(){
    const contract = await util.bootstrapCoverage('or/bzx-or', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(3);

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 9: 1
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 0], 2: [0, 1]
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 1,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1, 2: 1
    });
  })
});
