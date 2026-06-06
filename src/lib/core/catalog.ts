import { listMarkets, getMarket } from '@/lib/polymarket/gamma';
import type { MarketCategory } from '@/lib/polymarket/types';
import type { PredictionMarket } from './market';
import { adaptPolymarketGammaMarket } from '@/lib/providers/polymarket/adapter';
import {
  getCredenceNativeMarket,
  listCredenceNativeMarkets,
} from '@/lib/providers/credence-native/catalog';

export interface ListPredictionMarketsParams {
  category?: MarketCategory;
  limit?: number;
  offset?: number;
}

export async function listPredictionMarkets(
  params: ListPredictionMarketsParams = {},
): Promise<PredictionMarket[]> {
  const [nativeMarkets, polymarketMarkets] = await Promise.all([
    listCredenceNativeMarkets(),
    listMarkets(params).then((markets) => markets.map(adaptPolymarketGammaMarket)),
  ]);

  const merged = [...nativeMarkets, ...polymarketMarkets];
  if (!params.category || params.category === 'all') {
    return merged.slice(0, params.limit ?? merged.length);
  }

  return merged
    .filter((market) => market.category === params.category)
    .slice(0, params.limit ?? merged.length);
}

export async function getPredictionMarket(id: string): Promise<PredictionMarket> {
  if (id.startsWith('credence:') || isCredenceNativeSlug(id)) {
    const nativeMarket = await getCredenceNativeMarket(id);
    if (nativeMarket) return nativeMarket;
  }

  const normalizedId = id.startsWith('polymarket:')
    ? id.slice('polymarket:'.length)
    : id;
  return adaptPolymarketGammaMarket(await getMarket(normalizedId));
}

function isCredenceNativeSlug(id: string) {
  return (
    id.includes('ai-coding-agent') ||
    id.includes('china-enterprise-globalization') ||
    id.includes('cn-a-share-shanghai')
  );
}
