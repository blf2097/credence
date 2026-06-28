import type { PredictionMarket } from '@/lib/core/market';
import { credenceNativeMarkets } from './content-loader';
import { getAllNativeMarkets } from './dynamic-catalog';

export async function listCredenceNativeMarkets(): Promise<PredictionMarket[]> {
  // Merge static JSON markets with dynamic localStorage markets.
  // Dynamic markets appear first so newly created SKUs show up at the top.
  if (typeof window !== 'undefined') {
    return getAllNativeMarkets();
  }
  return credenceNativeMarkets;
}

export async function getCredenceNativeMarket(id: string): Promise<PredictionMarket | null> {
  const normalizedId = id.startsWith('credence:') ? id : `credence:${id}`;
  const all = await listCredenceNativeMarkets();
  return all.find((market) => market.id === normalizedId) ?? null;
}
