const assert = require('assert');
const util = require('./../util/util.js');

const ganache = require('ganache-cli');
const Coverage = require('./../../lib/coverage');

describe('for and while statements', () => {
  let coverage;
  let provider;
  let collector;

  before(async () => ({ provider, collector } = await util.initializeProvider(ganache)));
  beforeEach(() => coverage = new Coverage());
  after((done) => provider.close(done));

  // Runs: a() => for(var x = 1; x < 10; x++){\n sha3(x);\n }
  it('should cover a for statement with a bracketed body (multiline)', async function() {
    const contract = await util.bootstrapCoverage('loops/for-with-brackets', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a();
    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 6: 10,
    });
    assert.deepEqual(mapping[util.filePath].b, {});
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 10,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });

  // Runs: a() => for(var x = 1; x < 10; x++)\n sha3(x);\n
  it('should cover a for statement with an unbracketed body', async function() {
    const contract = await util.bootstrapCoverage('loops/for-no-brackets', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a();
    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 6: 10,
    });
    assert.deepEqual(mapping[util.filePath].b, {});
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 10,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });

  // Runs: a() => var t = true;\n while(t){\n t = false;\n }
  it('should cover a while statement with an bracketed body (multiline)', async function() {
    const contract = await util.bootstrapCoverage('loops/while-with-brackets', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a();
    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 6: 1, 7: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {});
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 1, 3: 1,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });

  // Runs: a() => var t = true;\n while(t)\n t = false;\n
  it('should cover a while statement with an unbracketed body (multiline)', async function() {
    const contract = await util.bootstrapCoverage('loops/while-no-brackets', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a();
    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 6: 1, 7: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {});
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 1, 3: 1,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
    });
  });
});
