/**
 * Gamma API client — read-only market & event metadata.
 *
 * No auth required. Public endpoint:
 *   https://gamma-api.polymarket.com
 *
 * Docs: https://docs.polymarket.com/#gamma-markets-api
 *
 * D2 task: wire up real fetches; for now return empty arrays
 * so the UI can render skeletons without errors.
 */

import type { GammaEvent, GammaMarket, MarketCategory } from './types';

const GAMMA_BASE =
  process.env.NEXT_PUBLIC_POLYMARKET_GAMMA_URL ??
  'https://gamma-api.polymarket.com';

interface ListMarketsParams {
  category?: MarketCategory;
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  order?: 'volume' | 'liquidity' | 'endDate';
}

/**
 * GET /markets — list active markets, sorted by volume by default.
 */
export async function listMarkets(
  params: ListMarketsParams = {},
): Promise<GammaMarket[]> {
  const url = new URL(`${GAMMA_BASE}/markets`);
  url.searchParams.set('active', String(params.active ?? true));
  url.searchParams.set('closed', String(params.closed ?? false));
  url.searchParams.set('limit', String(params.limit ?? 50));
  url.searchParams.set('offset', String(params.offset ?? 0));
  url.searchParams.set('order', params.order ?? 'volume');
  url.searchParams.set('ascending', 'false');

  if (params.category && params.category !== 'all') {
    // Gamma uses tags / categories; mapping refined in D2 once
    // we inspect a real response. For now pass-through.
    url.searchParams.set('tag_slug', params.category);
  }

  const res = await fetch(url, {
    next: { revalidate: 30 }, // ISR — refresh every 30s
  });

  if (!res.ok) {
    throw new Error(`Gamma listMarkets failed: ${res.status}`);
  }

  const data = (await res.json()) as GammaMarket[];
  return data;
}

/**
 * GET /markets/{id} — market detail.
 */
export async function getMarket(id: string): Promise<GammaMarket> {
  const res = await fetch(`${GAMMA_BASE}/markets/${id}`, {
    next: { revalidate: 15 },
  });
  if (!res.ok) throw new Error(`Gamma getMarket failed: ${res.status}`);
  return (await res.json()) as GammaMarket;
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
  return (await res.json()) as GammaEvent[];
}
