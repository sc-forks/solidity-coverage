const assert = require('assert');
const util = require('./../util/util.js');

const ganache = require('ganache-cli');
const Coverage = require('./../../lib/coverage');

describe('function declarations', () => {
  let coverage;
  let provider;
  let collector;

  before(async () => ({ provider, collector } = await util.initializeProvider(ganache)));
  beforeEach(() => coverage = new Coverage());
  after((done) => provider.close(done));

  it('should compile after instrumenting an ordinary function declaration', () => {
    const info = util.instrumentAndCompile('function/function');
    util.report(info.solcOutput.errors);
  });

  it('should compile after instrumenting an abstract function declaration', () => {
    const info = util.instrumentAndCompile('function/abstract');
    util.report(info.solcOutput.errors);
  });

  it('should compile after instrumenting a function declaration with an empty body', () => {
    const info = util.instrumentAndCompile('function/empty-body');
    util.report(info.solcOutput.errors);
  });

  it('should compile after instrumenting lots of declarations in row', () => {
    const info = util.instrumentAndCompile('function/multiple');
    util.report(info.solcOutput.errors);
  });

  it('should compile after instrumenting a new->constructor-->method chain', () => {
    const info = util.instrumentAndCompile('function/chainable-new');
    util.report(info.solcOutput.errors);
  });

  it('should compile after instrumenting a constructor call that chains to a method call', () => {
    const info = util.instrumentAndCompile('function/chainable');
    util.report(info.solcOutput.errors);
  });

  it('should compile after instrumenting a function with calldata keyword', () => {
    const info = util.instrumentAndCompile('function/calldata');
    util.report(info.solcOutput.errors);
  });

  it('should compile after instrumenting a constructor-->method-->value chain', () => {
    const info = util.instrumentAndCompile('function/chainable-value');
    util.report(info.solcOutput.errors);
  });

  it('should cover a simple invoked function call', async function() {
    const contract = await util.bootstrapCoverage('function/function-call', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a();
    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      7: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {});
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
      2: 1,
    });
  });

  it('should cover a modifier used on a function', async function() {
    const contract = await util.bootstrapCoverage('function/modifier', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(0);
    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 6: 1, 9: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {});
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
      2: 1,
    });
  });

  it('should cover a constructor that uses the `constructor` keyword', async function() {
    const contract = await util.bootstrapCoverage('function/constructor-keyword', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a();
    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      6: 1, 11: 1
    });
    assert.deepEqual(mapping[util.filePath].b, {});
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1, 2: 1
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
      2: 1,
    });
  });

  // We try and call a contract at an address where it doesn't exist and the VM
  // throws, but we can verify line / statement / fn coverage is getting mapped.
  it('should cover a constructor call that chains to a method call', async function() {
    const contract = await util.bootstrapCoverage('function/chainable', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);

    try { await contract.instance.a() } catch(err){}

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      9: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {});
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 0,
      2: 1,
    });
  });

  // The vm runs out of gas here - but we can verify line / statement / fn
  // coverage is getting mapped.
  it('should cover a constructor call that chains to a method call', async function() {
    const contract = await util.bootstrapCoverage('function/chainable-value', provider, collector);
    coverage.addContract(contract.instrumented, util.filePath);

    try { await contract.instance.a() } catch(err){}

    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      10: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {});
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1,
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 0,
      2: 1,
    });
  });
});

