import type { Address } from 'viem';

export interface Position {
  proxyWallet?: Address;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought?: number;
  realizedPnl?: number;
  percentRealizedPnl?: number;
  curPrice: number;
  redeemable?: boolean;
  mergeable?: boolean;
  title: string;
  slug?: string;
  icon?: string;
  eventSlug?: string;
  outcome: string;
  outcomeIndex?: number;
  oppositeOutcome?: string;
  oppositeAsset?: string;
  endDate?: string;
  negativeRisk?: boolean;
}

export interface OpenOrder {
  id: string;
  status: string;
  owner?: string;
  maker_address: string;
  market: string;
  asset_id: string;
  side: 'BUY' | 'SELL' | string;
  original_size: string;
  size_matched: string;
  price: string;
  outcome: string;
  created_at: number;
  expiration: string;
  order_type: string;
  associate_trades?: string[];
}

export interface PortfolioSummary {
  positionsValue: number;
  initialValue: number;
  cashPnl: number;
  openPositions: number;
}

export function summarizePositions(positions: Position[]): PortfolioSummary {
  return positions.reduce(
    (acc, position) => ({
      positionsValue: acc.positionsValue + safeNumber(position.currentValue),
      initialValue: acc.initialValue + safeNumber(position.initialValue),
      cashPnl: acc.cashPnl + safeNumber(position.cashPnl),
      openPositions: acc.openPositions + 1,
    }),
    {
      positionsValue: 0,
      initialValue: 0,
      cashPnl: 0,
      openPositions: 0,
    },
  );
}

function safeNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}
