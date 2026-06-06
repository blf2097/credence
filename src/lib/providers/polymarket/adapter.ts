import type { PredictionMarket } from '@/lib/core/market';
import type { GammaMarket } from '@/lib/polymarket/types';

export function adaptPolymarketGammaMarket(market: GammaMarket): PredictionMarket {
  return {
    id: `polymarket:${market.id}`,
    provider: 'polymarket',
    kind: market.outcomes.length > 2 ? 'categorical' : 'binary',
    settlementType: 'event',
    title: market.question,
    description: market.description,
    category: market.category,
    image: market.image,
    icon: market.icon,
    endDate: market.endDate,
    active: market.active,
    closed: market.closed,
    outcomes: market.outcomes.map((outcome, index) => ({
      id: `${market.id}:${index}`,
      label: outcome,
      price: toNumber(market.outcomePrices[index]),
      tokenId: market.clobTokenIds[index],
      sortOrder: index,
    })),
    metrics: {
      volume: market.volumeNum,
      volume24hr: market.volume24hr,
      liquidity: market.liquidityNum,
      bestBid: market.bestBid,
      bestAsk: market.bestAsk,
      spread: market.spread,
    },
    trading: {
      mode: 'external_clob',
      chainId: 137,
      collateralSymbol: 'pUSD',
      minTickSize: market.orderPriceMinTickSize,
      negRisk: market.negRisk,
      acceptingOrders: market.acceptingOrders,
    },
    source: {
      provider: 'polymarket',
      externalId: market.id,
      slug: market.slug,
      eventSlug: market.eventSlug,
      seriesSlug: market.seriesSlug,
    },
    metadata: {
      resolutionSource: market.resolutionSource,
      eventTitle: market.eventTitle,
      raw: market,
    },
  };
}

export function getRawPolymarketMarket(market: PredictionMarket): GammaMarket | null {
  if (market.provider !== 'polymarket') return null;
  const raw = market.metadata?.raw;
  return raw && typeof raw === 'object' ? (raw as GammaMarket) : null;
}

function toNumber(value: string | number | undefined): number | undefined {
  const n = typeof value === 'number' ? value : Number.parseFloat(value ?? '');
  return Number.isFinite(n) ? n : undefined;
}
