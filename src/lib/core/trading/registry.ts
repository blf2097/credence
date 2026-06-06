import type { PredictionMarket } from '@/lib/core/market';
import type { TradingAdapter, TradingAdapterContext } from './types';
import { createPolymarketTradingAdapter } from '@/lib/providers/polymarket/trading/adapter';

export function getTradingAdapter(
  market: PredictionMarket,
  context: TradingAdapterContext,
): TradingAdapter | null {
  const adapters = [createPolymarketTradingAdapter(context)];
  return adapters.find((adapter) => adapter.canHandle(market)) ?? null;
}
