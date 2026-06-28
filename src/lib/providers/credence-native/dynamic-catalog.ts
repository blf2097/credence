/**
 * Dynamic native SKU storage.
 *
 * Admin-created SKUs are stored in localStorage and merged with the static
 * JSON content from src/content/native-skus/. This lets the user add new
 * SKUs and world models without editing code or JSON files.
 *
 * When Supabase is active, dynamic SKUs should be written to the
 * native_markets table instead. For now, localStorage is the MVP store.
 */

import type { PredictionMarket, WorldModelNode } from '@/lib/core/market';
import { credenceNativeMarkets, credenceWorldModels } from './content-loader';

const DYNAMIC_MARKETS_KEY = 'credence:dynamic-native-markets:v1';
const DYNAMIC_MODELS_KEY = 'credence:dynamic-world-models:v1';

// ---------------------------------------------------------------------------
// Dynamic markets
// ---------------------------------------------------------------------------

export function getDynamicMarkets(): PredictionMarket[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(DYNAMIC_MARKETS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PredictionMarket[]) : [];
  } catch {
    window.localStorage.removeItem(DYNAMIC_MARKETS_KEY);
    return [];
  }
}

export function saveDynamicMarket(market: PredictionMarket): void {
  if (typeof window === 'undefined') return;
  const existing = getDynamicMarkets();
  const filtered = existing.filter((m) => m.id !== market.id);
  const next = [market, ...filtered];
  window.localStorage.setItem(DYNAMIC_MARKETS_KEY, JSON.stringify(next));
}

export function deleteDynamicMarket(id: string): void {
  if (typeof window === 'undefined') return;
  const existing = getDynamicMarkets();
  const filtered = existing.filter((m) => m.id !== id);
  window.localStorage.setItem(DYNAMIC_MARKETS_KEY, JSON.stringify(filtered));
}

/** Merge static JSON markets with dynamic localStorage markets. */
export function getAllNativeMarkets(): PredictionMarket[] {
  return [...getDynamicMarkets(), ...credenceNativeMarkets];
}

// ---------------------------------------------------------------------------
// Dynamic world models
// ---------------------------------------------------------------------------

export function getDynamicWorldModels(): WorldModelNode[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(DYNAMIC_MODELS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WorldModelNode[]) : [];
  } catch {
    window.localStorage.removeItem(DYNAMIC_MODELS_KEY);
    return [];
  }
}

export function saveDynamicWorldModel(model: WorldModelNode): void {
  if (typeof window === 'undefined') return;
  const existing = getDynamicWorldModels();
  const filtered = existing.filter((m) => m.id !== model.id);
  const next = [model, ...filtered];
  window.localStorage.setItem(DYNAMIC_MODELS_KEY, JSON.stringify(next));
}

export function deleteDynamicWorldModel(id: string): void {
  if (typeof window === 'undefined') return;
  const existing = getDynamicWorldModels();
  const filtered = existing.filter((m) => m.id !== id);
  window.localStorage.setItem(DYNAMIC_MODELS_KEY, JSON.stringify(filtered));
}

/** Merge static JSON world models with dynamic localStorage world models. */
export function getAllWorldModels(): WorldModelNode[] {
  return [...getDynamicWorldModels(), ...credenceWorldModels];
}
