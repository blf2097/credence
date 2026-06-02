/**
 * Polymarket data types — minimal subset needed for the MVP.
 * Full schema reference:
 *   - Gamma: https://docs.polymarket.com/#gamma-markets-api
 *   - CLOB:  https://docs.polymarket.com/#clob-api
 *
 * We intentionally keep these narrow. Add fields as the UI needs them.
 */

// ----------- Gamma (read-only market metadata) -----------

export interface GammaMarket {
  id: string;
  question: string;
  description: string;
  slug: string;
  endDate: string; // ISO
  volume: string;
  liquidity: string;
  volumeNum: number;
  liquidityNum: number;
  volume24hr?: number;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  negRisk?: boolean;
  orderPriceMinTickSize?: string;
  // Token IDs are needed to place orders on CLOB.
  // Each market has 2 outcomes (Yes/No), so 2 token ids.
  clobTokenIds: string[];
  outcomes: string[]; // e.g. ["Yes", "No"]
  outcomePrices: string[]; // e.g. ["0.62", "0.38"]
  category?: string;
  image?: string;
  icon?: string;
  active: boolean;
  closed: boolean;
  acceptingOrders: boolean;
  resolutionSource?: string;
  eventTitle?: string;
  eventSlug?: string;
  seriesSlug?: string;
}

export interface GammaEvent {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  description: string;
  endDate: string;
  image?: string;
  markets: GammaMarket[];
}

export interface RawGammaMarket {
  id?: string | number;
  question?: string;
  description?: string;
  slug?: string;
  endDate?: string;
  endDateIso?: string;
  volume?: string | number;
  liquidity?: string | number;
  volumeNum?: number;
  liquidityNum?: number;
  volume24hr?: number;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  negRisk?: boolean;
  orderPriceMinTickSize?: string;
  clobTokenIds?: string | string[];
  outcomes?: string | string[];
  outcomePrices?: string | string[];
  category?: string;
  image?: string;
  icon?: string;
  active?: boolean;
  closed?: boolean;
  acceptingOrders?: boolean;
  resolutionSource?: string;
  events?: Array<{
    title?: string;
    slug?: string;
    image?: string;
    icon?: string;
    resolutionSource?: string;
    seriesSlug?: string;
    series?: Array<{ slug?: string; title?: string }>;
  }>;
}

export type MarketCategory =
  | 'all'
  | 'politics'
  | 'crypto'
  | 'sports'
  | 'tech'
  | 'world';

// ----------- CLOB (order book + trading) -----------

export interface OrderBookLevel {
  price: string;
  size: string;
}

export interface OrderBook {
  marketId: string;
  asks: OrderBookLevel[];
  bids: OrderBookLevel[];
  timestamp: number;
}

export type OrderSide = 'BUY' | 'SELL';

export interface PlaceOrderInput {
  tokenId: string;
  side: OrderSide;
  // Price in [0, 1] — probability units
  price: number;
  // Number of outcome shares
  size: number;
}
