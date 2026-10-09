import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser-side Supabase client.
 *
 * Only the public project URL and the publishable/anon key are ever used here.
 * The service-role key must never reach the browser; all privileged work runs
 * in the serverless endpoints under `api/`.
 *
 * A single lazy singleton is shared across the app so we never initialise a
 * duplicate client.
 */
let browserClient: SupabaseClient | null = null;

export function getBrowserSupabaseClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return browserClient;
}
