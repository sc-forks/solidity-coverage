/* eslint-env node, mocha */

const solc = require('solc');
const getInstrumentedVersion = require('./../instrumentSolidity.js');
const util = require('./util/util.js');

describe('Battery test of production contracts: OpenZeppelin', () => {
  it('should compile after instrumenting zeppelin-solidity/Bounty.sol', () => {
    const bounty = getInstrumentedVersion(util.getCode('zeppelin/Bounty.sol'), 'bounty.sol');
    const ownable = getInstrumentedVersion(util.getCode('zeppelin/Ownable.sol'), 'ownable.sol');
    const pullPayment = getInstrumentedVersion(util.getCode('zeppelin/pullPayment.sol'), 'pullPayment.sol');
    const killable = getInstrumentedVersion(util.getCode('zeppelin/Killable.sol'), 'killable.sol');
    const inputs = {
      'Ownable.sol': ownable.contract,
      'PullPayment.sol': pullPayment.contract,
      'Killable.sol': killable.contract,
      'Bounty.sol': bounty.contract,
    };
    const output = solc.compile({
      sources: inputs,
    }, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/Claimable.sol', () => {
    const contract = util.getCode('zeppelin/Claimable.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const inputs = {
      'Ownable.sol': util.getCode('zeppelin/Ownable.sol'),
      'Claimable.sol': info.contract,
    };
    const output = solc.compile(inputs, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/DayLimit.sol', () => {
    const contract = util.getCode('zeppelin/DayLimit.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const inputs = {
      'Ownable.sol': util.getCode('zeppelin/Shareable.sol'),
      'DayLimit.sol': info.contract,
    };
    const output = solc.compile(inputs, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/Killable.sol', () => {
    const contract = util.getCode('zeppelin/Killable.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const inputs = {
      'Ownable.sol': util.getCode('zeppelin/Ownable.sol'),
      'Killable.sol': info.contract,
    };
    const output = solc.compile(inputs, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/LimitBalance.sol', () => {
    const contract = util.getCode('zeppelin/LimitBalance.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/Migrations.sol', () => {
    const contract = util.getCode('zeppelin/Migrations.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const inputs = {
      'Ownable.sol': util.getCode('zeppelin/Ownable.sol'),
      'Migrations.sol': info.contract,
    };
    const output = solc.compile(inputs, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/Multisig.sol', () => {
    const contract = util.getCode('zeppelin/Multisig.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/MultisigWallet.sol', () => {
    const contract = util.getCode('zeppelin/MultisigWallet.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const inputs = {
      'Multisig.sol': util.getCode('zeppelin/Multisig.sol'),
      'Shareable.sol': util.getCode('zeppelin/Shareable.sol'),
      'DayLimit.sol': util.getCode('zeppelin/DayLimit.sol'),
      'MultisigWallet.sol': info.contract,
    };
    const output = solc.compile(inputs, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/Ownable.sol', () => {
    const contract = util.getCode('zeppelin/Ownable.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/PullPayment.sol', () => {
    const contract = util.getCode('zeppelin/PullPayment.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/SafeMath.sol', () => {
    const contract = util.getCode('zeppelin/SafeMath.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/Shareable.sol', () => {
    const contract = util.getCode('zeppelin/Shareable.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/Stoppable.sol', () => {
    const contract = util.getCode('zeppelin/Stoppable.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const inputs = {
      'Ownable.sol': util.getCode('zeppelin/Ownable.sol'),
      'Stoppable.sol': info.contract,
    };
    const output = solc.compile(inputs, 1);
    util.report(output.errors);
  });
  // --- Tokens ---
  it('should compile after instrumenting zeppelin-solidity/BasicToken.sol', () => {
    const contract = util.getCode('zeppelin/token/BasicToken.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const inputs = {
      'ERC20Basic.sol': util.getCode('zeppelin/token/ERC20Basic.sol'),
      'SafeMath.sol': util.getCode('zeppelin/SafeMath.sol'),
      'BasicToken.sol': info.contract,
    };
    const output = solc.compile(inputs, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/CrowdsaleToken.sol', () => {
    const contract = util.getCode('zeppelin/token/CrowdsaleToken.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const inputs = {
      'StandardToken.sol': util.getCode('zeppelin/token/StandardToken.sol'),
      'CrowdsaleToken.sol': info.contract,
    };
    const output = solc.compile(inputs, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/ERC20.sol', () => {
    const contract = util.getCode('zeppelin/token/ERC20.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/ERC20Basic.sol', () => {
    const contract = util.getCode('zeppelin/token/ERC20Basic.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/SimpleToken.sol', () => {
    const contract = util.getCode('zeppelin/token/SimpleToken.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const inputs = {
      'StandardToken.sol': util.getCode('zeppelin/token/StandardToken.sol'),
      'SimpleToken.sol': info.contract,
    };
    const output = solc.compile(inputs, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/StandardToken.sol', () => {
    const contract = util.getCode('zeppelin/token/StandardToken.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const inputs = {
      'ERC20Basic.sol': util.getCode('zeppelin/token/ERC20Basic.sol'),
      'SafeMath.sol': util.getCode('zeppelin/SafeMath.sol'),
      'StandardToken.sol': info.contract,
    };
    const output = solc.compile(inputs, 1);
    util.report(output.errors);
  });
});
