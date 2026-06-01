import type { Address } from 'viem';

export const POLYGON_CHAIN_ID = 137;

/**
 * Polymarket production contracts on Polygon.
 * Source: https://docs.polymarket.com/resources/contracts.md
 */
export const POLYMARKET_CONTRACTS = {
  ctfExchange: '0xE111180000d2663C0091e4f400237545B87B996B',
  negRiskCtfExchange: '0xe2222d279d744050d28e00520010520000310F59',
  negRiskAdapter: '0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296',
  conditionalTokens: '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045',
  pUsdCollateral: '0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB',
  collateralOnramp: '0x93070a847efEf7F70739046A929D47a521F5B8ee',
  collateralOfframp: '0x2957922Eb93258b93368531d39fAcCA3B4dC5854',
  ctfCollateralAdapter: '0xAdA100Db00Ca00073811820692005400218FcE1f',
  negRiskCtfCollateralAdapter: '0xadA2005600Dec949baf300f4C6120000bDB6eAab',
} as const satisfies Record<string, Address>;

export const POLYMARKET_COLLATERAL_DECIMALS = 6;

export function getExchangeSpender({ negRisk }: { negRisk?: boolean }): Address {
  return negRisk
    ? POLYMARKET_CONTRACTS.negRiskCtfExchange
    : POLYMARKET_CONTRACTS.ctfExchange;
}
