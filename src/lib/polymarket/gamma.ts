/**
 * Gamma API client — read-only market & event metadata.
 *
 * No auth required. Public endpoint:
 *   https://gamma-api.polymarket.com
 *
 * Important D2 finding: Gamma returns some array-like fields
 * (`outcomes`, `outcomePrices`, `clobTokenIds`) as JSON strings, not arrays.
 * Always normalize before sending data to UI components.
 */

import type {
  GammaEvent,
  GammaMarket,
  MarketCategory,
  RawGammaMarket,
} from './types';

const GAMMA_BASE =
  process.env.NEXT_PUBLIC_POLYMARKET_GAMMA_URL ??
  'https://gamma-api.polymarket.com';

interface ListMarketsParams {
  category?: MarketCategory;
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  order?: 'volume' | 'liquidity' | 'endDate' | 'volume24hr';
}

const CATEGORY_KEYWORDS: Record<Exclude<MarketCategory, 'all'>, string[]> = {
  politics: [
    'election',
    'president',
    'senate',
    'congress',
    'minister',
    'zelenskyy',
    'trump',
    'biden',
    'government',
    'politics',
  ],
  crypto: [
    'bitcoin',
    'btc',
    'ethereum',
    'eth',
    'solana',
    'sol',
    'crypto',
    'coin',
    'token',
    'binance',
    'coinbase',
  ],
  sports: [
    'fifa',
    'nba',
    'nfl',
    'mlb',
    'ufc',
    'soccer',
    'football',
    'tennis',
    'match',
    'score',
  ],
  tech: [
    'openai',
    'ai',
    'apple',
    'tesla',
    'nvidia',
    'google',
    'meta',
    'microsoft',
    'spacex',
  ],
  world: [
    'war',
    'ceasefire',
    'israel',
    'iran',
    'russia',
    'ukraine',
    'gaza',
    'country',
  ],
};

/**
 * GET /markets — list active markets, sorted by volume by default.
 */
export async function listMarkets(
  params: ListMarketsParams = {},
): Promise<GammaMarket[]> {
  const url = new URL(`${GAMMA_BASE}/markets`);
  url.searchParams.set('active', String(params.active ?? true));
  url.searchParams.set('closed', String(params.closed ?? false));
  // Fetch wider, filter locally. Gamma category/tag slugs are inconsistent.
  const fetchLimit = params.category && params.category !== 'all' ? 100 : params.limit ?? 50;
  url.searchParams.set('limit', String(fetchLimit));
  url.searchParams.set('offset', String(params.offset ?? 0));
  url.searchParams.set('order', params.order ?? 'volume24hr');
  url.searchParams.set('ascending', 'false');

  const res = await fetch(url, {
    next: { revalidate: 30 }, // ISR — refresh every 30s
  });

  if (!res.ok) {
    throw new Error(`Gamma listMarkets failed: ${res.status}`);
  }

  const raw = (await res.json()) as RawGammaMarket[];
  const normalized = raw.map(normalizeMarket).filter(isTradableMarket);

  if (!params.category || params.category === 'all') {
    return normalized.slice(0, params.limit ?? 50);
  }

  return normalized
    .filter((market) => matchesCategory(market, params.category!))
    .slice(0, params.limit ?? 50);
}

/**
 * GET /markets/{id} — market detail.
 */
export async function getMarket(id: string): Promise<GammaMarket> {
  const res = await fetch(`${GAMMA_BASE}/markets/${id}`, {
    next: { revalidate: 15 },
  });
  if (!res.ok) throw new Error(`Gamma getMarket failed: ${res.status}`);
  return normalizeMarket((await res.json()) as RawGammaMarket);
}

/**
 * GET /events — grouped markets (e.g. "2024 Election" event with sub-markets).
 */
export async function listEvents(limit = 20): Promise<GammaEvent[]> {
  const url = new URL(`${GAMMA_BASE}/events`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('active', 'true');
  url.searchParams.set('closed', 'false');

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Gamma listEvents failed: ${res.status}`);
  const events = (await res.json()) as Array<
    Omit<GammaEvent, 'markets'> & { markets?: RawGammaMarket[] }
  >;
  return events.map((event) => ({
    ...event,
    markets: (event.markets ?? []).map(normalizeMarket).filter(isTradableMarket),
  }));
}

function normalizeMarket(raw: RawGammaMarket): GammaMarket {
  const event = raw.events?.[0];
  const outcomes = parseStringArray(raw.outcomes);
  const outcomePrices = parseStringArray(raw.outcomePrices);
  const clobTokenIds = parseStringArray(raw.clobTokenIds);
  const volumeNum = toNumber(raw.volumeNum ?? raw.volume);
  const liquidityNum = toNumber(raw.liquidityNum ?? raw.liquidity);

  return {
    id: String(raw.id ?? ''),
    question: raw.question ?? 'Untitled market',
    description: raw.description ?? '',
    slug: raw.slug ?? '',
    endDate: raw.endDateIso ?? raw.endDate ?? '',
    volume: String(raw.volume ?? volumeNum),
    liquidity: String(raw.liquidity ?? liquidityNum),
    volumeNum,
    liquidityNum,
    volume24hr: raw.volume24hr,
    bestBid: raw.bestBid,
    bestAsk: raw.bestAsk,
    spread: raw.spread,
    negRisk: raw.negRisk,
    clobTokenIds,
    outcomes,
    outcomePrices,
    category: inferCategory(raw),
    image: raw.image ?? event?.image,
    icon: raw.icon ?? event?.icon,
    active: Boolean(raw.active),
    closed: Boolean(raw.closed),
    acceptingOrders: Boolean(raw.acceptingOrders),
    resolutionSource: raw.resolutionSource ?? event?.resolutionSource,
    eventTitle: event?.title,
    eventSlug: event?.slug,
    seriesSlug: event?.seriesSlug ?? event?.series?.[0]?.slug,
  };
}

function parseStringArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function toNumber(value: string | number | undefined): number {
  const n = typeof value === 'number' ? value : Number.parseFloat(value ?? '0');
  return Number.isFinite(n) ? n : 0;
}

function isTradableMarket(market: GammaMarket): boolean {
  return (
    market.active &&
    !market.closed &&
    market.acceptingOrders &&
    market.clobTokenIds.length >= 2 &&
    market.outcomePrices.length >= 2
  );
}

function matchesCategory(market: GammaMarket, category: MarketCategory): boolean {
  if (category === 'all') return true;
  return market.category === category;
}

function inferCategory(raw: RawGammaMarket): MarketCategory {
  const haystack = [
    raw.question,
    raw.slug,
    raw.category,
    raw.events?.[0]?.title,
    raw.events?.[0]?.slug,
    raw.events?.[0]?.seriesSlug,
    raw.events?.[0]?.series?.[0]?.slug,
    raw.events?.[0]?.series?.[0]?.title,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return category as MarketCategory;
    }
  }

  return 'world';
}
