import { getDashboardSupabaseClient } from '../auth/supabaseAuthClient';

/** Error carrying the HTTP status, used to distinguish 401/403 from other failures. */
export class AdminApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

/** Current dashboard access token from the persisted Supabase session. */
export async function getAdminAccessToken(): Promise<string | null> {
  const client = getDashboardSupabaseClient();
  if (!client) {
    return null;
  }
  const { data } = await client.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Fetch an admin endpoint with the current bearer token. Authorization is
 * always enforced server-side (`requireAdmin`); this only attaches the token.
 */
export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAdminAccessToken();
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  return fetch(path, { ...init, headers });
}

/** Build an AdminApiError from a failed response, preferring the server message. */
export async function readAdminError(response: Response, fallback: string): Promise<AdminApiError> {
  let message = fallback;
  try {
    const data: unknown = await response.json();
    if (data && typeof data === 'object' && 'message' in data) {
      const serverMessage = (data as { message?: unknown }).message;
      if (typeof serverMessage === 'string' && serverMessage.trim()) {
        message = serverMessage;
      }
    }
  } catch {
    // Ignore non-JSON bodies.
  }

  return new AdminApiError(response.status, message);
}
