const assert = require('assert');
const util = require('./../util/util.js');
const Coverage = require('./../../lib/coverage');
const Api = require('./../../lib/api')

describe('function declarations', () => {
  let coverage;
  let api;

  before(async () => api = new Api({silent: true}));
  beforeEach(() => coverage = new Coverage());
  after(async() => await api.finish());

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

  it('should cover a simple invoked function call', async function() {
    const contract = await util.bootstrapCoverage('function/function-call', api, this.provider);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(contract.gas);
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
    const contract = await util.bootstrapCoverage('function/modifier', api, this.provider);
    coverage.addContract(contract.instrumented, util.filePath);
    await contract.instance.a(0, contract.gas);
    const mapping = coverage.generate(contract.data, util.pathPrefix);

    assert.deepEqual(mapping[util.filePath].l, {
      5: 1, 6: 1, 9: 1,
    });
    assert.deepEqual(mapping[util.filePath].b, {
      1: [1, 0]
    });
    assert.deepEqual(mapping[util.filePath].s, {
      1: 1
    });
    assert.deepEqual(mapping[util.filePath].f, {
      1: 1,
      2: 1,
    });
  });
});

