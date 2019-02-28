/* eslint-env node, mocha */

const solc = require('solc');
const getInstrumentedVersion = require('./../lib/instrumentSolidity.js');
const util = require('./util/util.js');

describe('Battery test of production contracts: OpenZeppelin', () => {
  it('should compile after instrumenting ConditionalEscrow.sol', () => {
    const conditionalEscrow = getInstrumentedVersion(util.getCode('zeppelin/contracts/payment/escrow/ConditionalEscrow.sol'), 'ConditionalEscrow.sol');
    const escrow = getInstrumentedVersion(util.getCode('zeppelin/contracts/payment/escrow/Escrow.sol'), 'Escrow.sol');
    const safeMath = getInstrumentedVersion(util.getCode('zeppelin/contracts/math/SafeMath.sol'), 'SafeMath.sol');
    const secondary = getInstrumentedVersion(util.getCode('zeppelin/contracts/ownership/Secondary.sol'), 'Secondary.sol');
    const input = JSON.stringify({
      language: 'Solidity',
      sources: {
        'ConditionalEscrow.sol': { content: conditionalEscrow.contract },
        'Escrow.sol': { content: escrow.contract},
        'SafeMath.sol': { content: safeMath.contract},
        'Secondary.sol': { content: secondary.contract},
      },
      settings: {
        remappings: ["math/=", "ownership/=" ]
      }
    });
    const output = JSON.parse(solc.compile(input));
    util.report(output.errors);
  });

  it('should compile after instrumenting FinalizableCrowdsale', () => {
    const finalizableCrowdsale = getInstrumentedVersion(util.getCode('zeppelin/contracts/crowdsale/distribution/FinalizableCrowdsale.sol'), 'FinalizableCrowdsale.sol');
    const timedCrowdsale = getInstrumentedVersion(util.getCode('zeppelin/contracts/crowdsale/validation/TimedCrowdsale.sol'), 'TimedCrowdsale.sol');
    const safeMath = getInstrumentedVersion(util.getCode('zeppelin/contracts/math/SafeMath.sol'), 'SafeMath.sol');
    const crowdsale = getInstrumentedVersion(util.getCode('zeppelin/contracts/crowdsale/Crowdsale.sol'), 'Crowdsale.sol');
    const ierc20 = getInstrumentedVersion(util.getCode('zeppelin/contracts/token/ERC20/IERC20.sol'), 'IERC20.sol');
    const safeErc20 = getInstrumentedVersion(util.getCode('zeppelin/contracts/token/ERC20/SafeERC20.sol'), 'SafeERC20.sol');
    const reentrancyGuard = getInstrumentedVersion(util.getCode('zeppelin/contracts/utils/ReentrancyGuard.sol'), 'ReentrancyGuard.sol');

    const input = JSON.stringify({
      language: 'Solidity',
      sources: {
        'FinalizableCrowdsale.sol': { content: finalizableCrowdsale.contract },
        'TimedCrowdsale.sol': { content: timedCrowdsale.contract},
        'SafeMath.sol': { content: safeMath.contract},
        'Crowdsale.sol': { content: crowdsale.contract},
        'IERC20.sol': { content: ierc20.contract},
        'SafeERC20.sol': { content: safeErc20.contract},
        'ReentrancyGuard.sol': { content: reentrancyGuard.contract},
      },
      settings: {
        remappings: ["math/=", "token/ERC20/=", "utils/=", "crowdsale/=", "validation/="]
      }
    });
    const output = JSON.parse(solc.compile(input));
    util.report(output.errors);
  });
});
