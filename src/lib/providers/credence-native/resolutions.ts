/**
 * Market resolution storage.
 *
 * Resolutions are stored locally for the MVP. When Supabase is active,
 * the `model_updates` / resolved-outcome columns in native_markets can
 * be used instead. For now, this is a thin localStorage-backed store that
 * the calibration engine reads from.
 */

import type { MarketResolution } from '@/lib/core/calibration';

const RESOLUTION_KEY = 'credence:market-resolutions:v1';

export async function getResolutions(): Promise<MarketResolution[]> {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(RESOLUTION_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MarketResolution[]) : [];
  } catch {
    window.localStorage.removeItem(RESOLUTION_KEY);
    return [];
  }
}

export async function getResolution(marketId: string): Promise<MarketResolution | null> {
  const all = await getResolutions();
  return all.find((r) => r.marketId === marketId) ?? null;
}

export async function saveResolution(
  resolution: Omit<MarketResolution, 'resolvedAt'>,
): Promise<MarketResolution> {
  const full: MarketResolution = {
    ...resolution,
    resolvedAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return full;

  const existing = await getResolutions();
  const filtered = existing.filter((r) => r.marketId !== resolution.marketId);
  const next = [full, ...filtered];
  window.localStorage.setItem(RESOLUTION_KEY, JSON.stringify(next));

  return full;
}

export async function clearResolution(marketId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const existing = await getResolutions();
  const filtered = existing.filter((r) => r.marketId !== marketId);
  window.localStorage.setItem(RESOLUTION_KEY, JSON.stringify(filtered));
}
