import type { Address } from 'viem';
import type { PredictionMarket, MarketOutcome, TradingMode } from '@/lib/core/market';
import type { CreateOrderResponse, OrderPreview } from '@/lib/polymarket/order';

export type TradeSide = 'BUY' | 'SELL';
export type TradeCapability = 'validate' | 'approve' | 'submit' | 'open_orders';

export interface TradeIntent {
  market: PredictionMarket;
  outcome: MarketOutcome;
  side: TradeSide;
  amount: number;
  price: number;
  shares: number;
  trader?: Address;
  spender?: Address;
}

export interface TradeValidationResult {
  ok: boolean;
  reason?: string;
}

export interface TradingAdapter {
  id: string;
  mode: TradingMode;
  capabilities: TradeCapability[];
  canHandle(market: PredictionMarket): boolean;
  buildPreview(intent: TradeIntent): OrderPreview | null;
  validateIntent(intent: TradeIntent): TradeValidationResult;
  submitPreview(preview: OrderPreview): Promise<CreateOrderResponse>;
}

export interface TradingAdapterContext {
  realTradingEnabled: boolean;
}
