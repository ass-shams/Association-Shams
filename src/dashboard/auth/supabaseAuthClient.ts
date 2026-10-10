import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Dedicated browser Supabase client for dashboard authentication.
 *
 * Deliberately separate from `src/lib/supabase.ts`, which never persists a
 * session and is left untouched for the public site. Only the public project
 * URL and the publishable/anon key are used here; the service-role key never
 * reaches the browser.
 *
 * The session is persisted through Supabase's own storage mechanism
 * (`persistSession` → browser storage under the dedicated key below). Passwords
 * are never stored by this application.
 */
const DASHBOARD_AUTH_STORAGE_KEY = 'shams-dashboard-auth';

let dashboardClient: SupabaseClient | null = null;

export function getDashboardSupabaseClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!dashboardClient) {
    dashboardClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: DASHBOARD_AUTH_STORAGE_KEY,
        flowType: 'pkce',
      },
    });
  }

  return dashboardClient;
}
