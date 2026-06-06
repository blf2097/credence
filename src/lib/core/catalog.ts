import { listMarkets, getMarket } from '@/lib/polymarket/gamma';
import type { MarketCategory } from '@/lib/polymarket/types';
import type { PredictionMarket } from './market';
import { adaptPolymarketGammaMarket } from '@/lib/providers/polymarket/adapter';

export interface ListPredictionMarketsParams {
  category?: MarketCategory;
  limit?: number;
  offset?: number;
}

export async function listPredictionMarkets(
  params: ListPredictionMarketsParams = {},
): Promise<PredictionMarket[]> {
  const markets = await listMarkets(params);
  return markets.map(adaptPolymarketGammaMarket);
}

export async function getPredictionMarket(id: string): Promise<PredictionMarket> {
  const normalizedId = id.startsWith('polymarket:')
    ? id.slice('polymarket:'.length)
    : id;
  return adaptPolymarketGammaMarket(await getMarket(normalizedId));
}
