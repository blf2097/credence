import type { PredictionMarket } from '@/lib/core/market';
import { credenceNativeMarkets } from './content-loader';

export async function listCredenceNativeMarkets(): Promise<PredictionMarket[]> {
  return credenceNativeMarkets;
}

export async function getCredenceNativeMarket(id: string): Promise<PredictionMarket | null> {
  const normalizedId = id.startsWith('credence:') ? id : `credence:${id}`;
  return credenceNativeMarkets.find((market) => market.id === normalizedId) ?? null;
}
