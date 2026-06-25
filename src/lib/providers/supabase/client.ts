import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Lazily create a browser-safe Supabase client.
 *
 * Returns null when env vars are absent so callers can fall back to
 * localStorage without importing Supabase into the bundle unnecessarily.
 *
 * IMPORTANT: only NEXT_PUBLIC_ vars are available in the browser.
 * The service-role key must never be exposed client-side.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  if (url.trim() === '' || anonKey.trim() === '') return null;

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function hasSupabaseEnv(): boolean {
  return getSupabaseClient() !== null;
}
