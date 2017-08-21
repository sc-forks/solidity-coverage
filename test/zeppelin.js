/* eslint-env node, mocha */

const solc = require('solc');
const getInstrumentedVersion = require('./../lib/instrumentSolidity.js');
const util = require('./util/util.js');

describe('Battery test of production contracts: OpenZeppelin', () => {
  it('should compile after instrumenting zeppelin-solidity/Bounty.sol', () => {
    const bounty = getInstrumentedVersion(util.getCode('zeppelin/Bounty.sol'), 'Bounty.sol');
    const ownable = getInstrumentedVersion(util.getCode('zeppelin/Ownable.sol'), 'Ownable.sol');
    const pullPayment = getInstrumentedVersion(util.getCode('zeppelin/PullPayment.sol'), 'PullPayment.sol');
    const killable = getInstrumentedVersion(util.getCode('zeppelin/Killable.sol'), 'Killable.sol');
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
    const claimable = getInstrumentedVersion(util.getCode('zeppelin/Claimable.sol'), 'Claimable.sol');
    const ownable = getInstrumentedVersion(util.getCode('zeppelin/Ownable.sol'), 'Ownable.sol');

    const inputs = {
      'Ownable.sol': ownable.contract,
      'Claimable.sol': claimable.contract,
    };
    const output = solc.compile({
      sources: inputs,
    }, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/DayLimit.sol', () => {
    const dayLimit = getInstrumentedVersion(util.getCode('zeppelin/DayLimit.sol'), 'DayLimit.sol');
    const ownable = getInstrumentedVersion(util.getCode('zeppelin/Ownable.sol'), 'Ownable.sol');
    const shareable = getInstrumentedVersion(util.getCode('zeppelin/Shareable.sol'), 'Shareable.sol');

    const inputs = {
      'Ownable.sol': ownable.contract,
      'DayLimit.sol': dayLimit.contract,
      'Shareable.sol': shareable.contract,
    };
    const output = solc.compile({
      sources: inputs,
    }, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/Killable.sol', () => {
    const ownable = getInstrumentedVersion(util.getCode('zeppelin/Ownable.sol'), 'Ownable.sol');
    const killable = getInstrumentedVersion(util.getCode('zeppelin/Killable.sol'), 'Killable.sol');
    const inputs = {
      'Ownable.sol': ownable.contract,
      'Killable.sol': killable.contract,
    };
    const output = solc.compile({
      sources: inputs,
    }, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/LimitBalance.sol', () => {
    const contract = util.getCode('zeppelin/LimitBalance.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/Migrations.sol', () => {
    const ownable = getInstrumentedVersion(util.getCode('zeppelin/Ownable.sol'), 'Ownable.sol');
    const migrations = getInstrumentedVersion(util.getCode('zeppelin/Migrations.sol'), 'Migrations.sol');
    const inputs = {
      'Ownable.sol': ownable.contract,
      'Migrations.sol': migrations.contract,
    };
    const output = solc.compile({
      sources: inputs,
    }, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/Multisig.sol', () => {
    const contract = util.getCode('zeppelin/Multisig.sol');
    const info = getInstrumentedVersion(contract, 'test.sol');
    const output = solc.compile(info.contract, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/MultisigWallet.sol', () => {
    const multisig = getInstrumentedVersion(util.getCode('zeppelin/Multisig.sol'), 'Multisig.sol');
    const shareable = getInstrumentedVersion(util.getCode('zeppelin/Shareable.sol'), 'Shareable.sol');
    const dayLimit = getInstrumentedVersion(util.getCode('zeppelin/DayLimit.sol'), 'DayLimit.sol');
    const multisigWallet = getInstrumentedVersion(util.getCode('zeppelin/MultisigWallet.sol'), 'MultisigWallet.sol');
    const inputs = {
      'Multisig.sol': multisig.contract,
      'Shareable.sol': shareable.contract,
      'DayLimit.sol': dayLimit.contract,
      'MultisigWallet.sol': multisigWallet.contract,
    };
    const output = solc.compile({
      sources: inputs,
    }, 1);
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
    const stoppable = getInstrumentedVersion(util.getCode('zeppelin/Stoppable.sol'), 'Stoppable.sol');
    const ownable = getInstrumentedVersion(util.getCode('zeppelin/Ownable.sol'), 'Ownable.sol');
    const inputs = {
      'Ownable.sol': ownable.contract,
      'Stoppable.sol': stoppable.contract,
    };
    const output = solc.compile({
      sources: inputs,
    }, 1);
    util.report(output.errors);
  });
  // --- Tokens ---
  it('should compile after instrumenting zeppelin-solidity/BasicToken.sol', () => {
    const basicToken = getInstrumentedVersion(util.getCode('zeppelin/token/BasicToken.sol'), 'BasicToken.sol');
    const safeMath = getInstrumentedVersion(util.getCode('zeppelin/SafeMath.sol'), 'SafeMath.sol');
    const ERC20Basic = getInstrumentedVersion(util.getCode('zeppelin/token/ERC20Basic.sol'), 'ERC20Basic.sol');

    const inputs = {
      'ERC20Basic.sol': ERC20Basic.contract,
      'SafeMath.sol': safeMath.contract,
      'BasicToken.sol': basicToken.contract,
    };
    const output = solc.compile({
      sources: inputs,
    }, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/CrowdsaleToken.sol', () => {
    const crowdsaleToken = getInstrumentedVersion(util.getCode('zeppelin/token/CrowdsaleToken.sol'), 'CrowdsaleToken.sol');
    const standardToken = getInstrumentedVersion(util.getCode('zeppelin/token/StandardToken.sol'), 'StandardToken.sol');
    const ERC20Basic = getInstrumentedVersion(util.getCode('zeppelin/token/ERC20Basic.sol'), 'ERC20Basic.sol');
    const ERC20 = getInstrumentedVersion(util.getCode('zeppelin/token/ERC20.sol'), 'ERC20.sol');
    const safeMath = getInstrumentedVersion(util.getCode('zeppelin/SafeMath.sol'), 'SafeMath.sol');

    const inputs = {
      'StandardToken.sol': standardToken.contract,
      'CrowdsaleToken.sol': crowdsaleToken.contract,
      'ERC20Basic.sol': ERC20Basic.contract,
      'ERC20.sol': ERC20.contract,
      'SafeMath.sol': safeMath.contract,
    };
    const output = solc.compile({
      sources: inputs,
    }, 1);
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
    const standardToken = getInstrumentedVersion(util.getCode('zeppelin/token/StandardToken.sol'), 'StandardToken.sol');
    const simpleToken = getInstrumentedVersion(util.getCode('zeppelin/token/SimpleToken.sol'), 'SimpleToken.sol');
    const ERC20 = getInstrumentedVersion(util.getCode('zeppelin/token/ERC20.sol'), 'ERC20.sol');
    const safeMath = getInstrumentedVersion(util.getCode('zeppelin/SafeMath.sol'), 'SafeMath.sol');

    const inputs = {
      'StandardToken.sol': standardToken.contract,
      'SimpleToken.sol': simpleToken.contract,
      'ERC20.sol': ERC20.contract,
      'SafeMath.sol': safeMath.contract,
    };
    const output = solc.compile({
      sources: inputs,
    }, 1);
    util.report(output.errors);
  });

  it('should compile after instrumenting zeppelin-solidity/StandardToken.sol', () => {
    const ERC20Basic = getInstrumentedVersion(util.getCode('zeppelin/token/ERC20Basic.sol'), 'ERC20Basic.sol');
    const standardToken = getInstrumentedVersion(util.getCode('zeppelin/token/StandardToken.sol'), 'StandardToken.sol');
    const safeMath = getInstrumentedVersion(util.getCode('zeppelin/SafeMath.sol'), 'SafeMath.sol');
    const ERC20 = getInstrumentedVersion(util.getCode('zeppelin/token/ERC20.sol'), 'ERC20.sol');

    const inputs = {
      'ERC20Basic.sol': ERC20Basic.contract,
      'SafeMath.sol': safeMath.contract,
      'StandardToken.sol': standardToken.contract,
      'ERC20.sol': ERC20.contract,
    };
    const output = solc.compile({
      sources: inputs,
    }, 1);
    util.report(output.errors);
  });
});
