/** Identity returned by the server only after the `admin_users` allowlist check. */
export interface AdminIdentity {
  readonly id: string;
  readonly email: string | null;
}

/** Minimal signed-in user shape used by the dashboard UI. */
export interface SessionUser {
  readonly id: string;
  readonly email: string | null;
}

/**
 * Dashboard authentication state.
 *
 * `authenticated` means a valid Supabase session AND an allowlisted admin.
 * `unauthorized` means a valid session whose account is not an administrator.
 * `error` means verification could not complete (network/timeout/server), which
 * is recoverable with a retry and is never treated as a successful login.
 */
export type AuthStatus =
  | 'loading'
  | 'unconfigured'
  | 'unauthenticated'
  | 'unauthorized'
  | 'error'
  | 'authenticated';
