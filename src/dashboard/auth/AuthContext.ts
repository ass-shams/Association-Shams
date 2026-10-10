import { createContext } from 'react';
import type { AdminIdentity, AuthStatus, SessionUser } from './types';

export interface AuthContextValue {
  readonly status: AuthStatus;
  readonly user: SessionUser | null;
  readonly admin: AdminIdentity | null;
  readonly error: string | null;
  /** True while a sign-in request is in flight. */
  readonly isSigningIn: boolean;
  /**
   * False when the browser Supabase client could not be created because
   * `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing. The login form
   * still renders; it simply cannot submit until the environment is set.
   */
  readonly isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-runs session restoration + admin verification after a recoverable error. */
  retry: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
