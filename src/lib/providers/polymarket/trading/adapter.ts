import type { TradingAdapter, TradingAdapterContext, TradeIntent } from '@/lib/core/trading/types';
import type { PredictionMarket } from '@/lib/core/market';
import type { CreateOrderResponse, OrderPreview } from '@/lib/polymarket/order';

export function createPolymarketTradingAdapter(
  _context: TradingAdapterContext,
): TradingAdapter {
  return {
    id: 'polymarket-clob',
    mode: 'external_clob',
    capabilities: ['validate', 'approve', 'submit', 'open_orders'],
    canHandle(market: PredictionMarket) {
      return market.provider === 'polymarket' && market.trading.mode === 'external_clob';
    },
    validateIntent(intent: TradeIntent) {
      if (!this.canHandle(intent.market)) {
        return { ok: false, reason: 'This market is not handled by Polymarket CLOB.' };
      }
      if (!intent.trader) return { ok: false, reason: 'Wallet address is required.' };
      if (!intent.spender) return { ok: false, reason: 'Collateral spender is required.' };
      if (!intent.outcome.tokenId) {
        return { ok: false, reason: 'Selected outcome has no CLOB token ID.' };
      }
      if (intent.side !== 'BUY') {
        return { ok: false, reason: 'Current MVP supports BUY orders only.' };
      }
      if (!Number.isFinite(intent.amount) || intent.amount <= 0) {
        return { ok: false, reason: 'Amount must be greater than 0.' };
      }
      if (!Number.isFinite(intent.price) || intent.price <= 0 || intent.price >= 1) {
        return { ok: false, reason: 'Price must be between 0 and 1.' };
      }
      if (!Number.isFinite(intent.shares) || intent.shares <= 0) {
        return { ok: false, reason: 'Shares must be greater than 0.' };
      }
      return { ok: true };
    },
    buildPreview(intent: TradeIntent): OrderPreview | null {
      const validation = this.validateIntent(intent);
      if (!validation.ok || !intent.trader || !intent.spender || !intent.outcome.tokenId) {
        return null;
      }
      return {
        marketId: intent.market.source.externalId,
        tokenId: intent.outcome.tokenId,
        outcome: intent.outcome.label.toUpperCase() === 'NO' ? 'NO' : 'YES',
        side: intent.side,
        price: intent.price,
        size: intent.shares,
        collateralAmount: intent.amount,
        trader: intent.trader,
        spender: intent.spender,
        tickSize: intent.market.trading.minTickSize ?? '0.01',
        negRisk: intent.market.trading.negRisk,
      };
    },
    async submitPreview(preview: OrderPreview): Promise<CreateOrderResponse> {
      const { submitBrowserLimitOrder } = await import('@/lib/polymarket/browser-clob');
      return submitBrowserLimitOrder(preview);
    },
  };
}
