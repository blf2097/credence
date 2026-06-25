import type { PredictionRepository } from './prediction-repository';
import { hasSupabaseEnv } from '@/lib/providers/supabase/client';
import { supabasePredictionRepository } from '@/lib/providers/supabase/prediction-repository';
import { localStoragePredictionRepository } from '@/lib/providers/local-storage/prediction-repository';

/**
 * Resolve which prediction repository the app should use at runtime.
 *
 * - If NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set,
 *   use the Supabase repository.
 * - Otherwise, fall back to localStorage.
 *
 * This is the single switch point. All submission helpers and components
 * should call this function, never import a concrete repository directly.
 */
export function getPredictionRepository(): PredictionRepository {
  if (hasSupabaseEnv()) {
    return supabasePredictionRepository;
  }
  return localStoragePredictionRepository;
}
