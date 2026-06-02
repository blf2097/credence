import type { Address } from 'viem';
import type { Position } from './portfolio';

export const DATA_API_BASE = 'https://data-api.polymarket.com';

export interface PositionsQuery {
  user: Address | string;
  limit?: number;
  offset?: number;
  sizeThreshold?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export function buildPositionsUrl(
  query: PositionsQuery,
  base = DATA_API_BASE,
): URL {
  const url = new URL('/positions', base);
  url.searchParams.set('user', query.user);
  url.searchParams.set('limit', String(query.limit ?? 100));
  url.searchParams.set('offset', String(query.offset ?? 0));
  url.searchParams.set('sizeThreshold', String(query.sizeThreshold ?? 0));
  url.searchParams.set('sortBy', query.sortBy ?? 'CURRENT');
  url.searchParams.set('sortDirection', query.sortDirection ?? 'DESC');
  return url;
}

export function normalizePositionsPayload(payload: unknown): Position[] {
  if (Array.isArray(payload)) return payload as Position[];
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as Position[];
    if (Array.isArray(record.positions)) return record.positions as Position[];
  }
  return [];
}
