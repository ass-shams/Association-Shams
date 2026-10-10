import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';
import { fetchAdminIdentity } from './adminService';
import { getDashboardSupabaseClient } from './supabaseAuthClient';
import type { AdminIdentity, AuthStatus, SessionUser } from './types';

const INVALID_CREDENTIALS_MESSAGE = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
const SESSION_LOAD_ERROR_MESSAGE = 'تعذّر تحميل الجلسة. المرجو إعادة المحاولة.';

/** Upper bound for Supabase session initialization (local read + token refresh). */
const SESSION_INIT_TIMEOUT_MS = 15_000;

/**
 * Reject if a promise does not settle in time. Guards against a stalled
 * `getSession()` (e.g. a refresh request that never resolves) leaving the UI
 * stuck in `loading` forever.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function toSessionUser(session: Session): SessionUser {
  return { id: session.user.id, email: session.user.email ?? null };
}

/**
 * Dashboard authentication provider.
 *
 * Restores any persisted Supabase session, keeps it in sync with
 * `onAuthStateChange`, and resolves administrator authorization through the
 * server (`/api/admin/me`). A session that is no longer valid is cleared
 * safely. Admin status is never inferred from client-editable metadata.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef(getDashboardSupabaseClient());
  const [status, setStatus] = useState<AuthStatus>(() =>
    clientRef.current ? 'loading' : 'unconfigured',
  );
  const isConfigured = clientRef.current !== null;
  const [user, setUser] = useState<SessionUser | null>(null);
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const resolvedTokenRef = useRef<string | null>(null);

  const applySession = useCallback(async (session: Session | null) => {
    const client = clientRef.current;
    if (!client) {
      setStatus('unconfigured');
      return;
    }

    if (!session) {
      resolvedTokenRef.current = null;
      setUser(null);
      setAdmin(null);
      setStatus('unauthenticated');
      return;
    }

    // Avoid duplicate server checks for the same access token (initial load +
    // auth-state events can report the same session).
    if (resolvedTokenRef.current === session.access_token) {
      return;
    }
    resolvedTokenRef.current = session.access_token;

    const check = await fetchAdminIdentity(session.access_token);

    if (check.status === 'admin') {
      setUser(toSessionUser(session));
      setAdmin(check.admin);
      setError(null);
      setStatus('authenticated');
      return;
    }

    if (check.status === 'unauthenticated') {
      // The token was rejected (expired/invalid): clear the stale session.
      resolvedTokenRef.current = null;
      setUser(null);
      setAdmin(null);
      await client.auth.signOut();
      setStatus('unauthenticated');
      return;
    }

    if (check.status === 'forbidden') {
      // Authenticated but not in the administrator allowlist.
      setUser(toSessionUser(session));
      setAdmin(null);
      setError(check.message);
      setStatus('unauthorized');
      return;
    }

    /*
     * unavailable (503/404/non-JSON), network, timeout, or error: verification
     * could not complete. Keep the session but surface a recoverable error —
     * never a successful login.
     */
    setUser(toSessionUser(session));
    setAdmin(null);
    setError(check.message);
    setStatus('error');
  }, []);

  useEffect(() => {
    const client = clientRef.current;
    if (!client) {
      return;
    }

    let active = true;

    void withTimeout(client.auth.getSession(), SESSION_INIT_TIMEOUT_MS)
      .then(({ data }) => {
        if (active) {
          void applySession(data.session);
        }
      })
      .catch(() => {
        // getSession rejected or timed out: never leave the UI in `loading`.
        if (active) {
          setError(SESSION_LOAD_ERROR_MESSAGE);
          setStatus('error');
        }
      });

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      /*
       * Defer out of the auth callback. `applySession` may call `signOut` for a
       * rejected session, and invoking Supabase auth methods synchronously
       * inside `onAuthStateChange` can deadlock on the auth lock.
       */
      setTimeout(() => {
        void applySession(session);
      }, 0);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const client = clientRef.current;
      if (!client) {
        setStatus('unconfigured');
        return;
      }

      setError(null);
      setIsSigningIn(true);

      try {
        const { data, error: signInError } = await client.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError || !data.session) {
          setUser(null);
          setAdmin(null);
          setError(INVALID_CREDENTIALS_MESSAGE);
          setStatus('unauthenticated');
          return;
        }

        await applySession(data.session);
      } finally {
        setIsSigningIn(false);
      }
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    const client = clientRef.current;
    resolvedTokenRef.current = null;
    if (client) {
      await client.auth.signOut();
    }
    setUser(null);
    setAdmin(null);
    setError(null);
    setStatus('unauthenticated');
  }, []);

  const retry = useCallback(async () => {
    const client = clientRef.current;
    if (!client) {
      setStatus('unconfigured');
      return;
    }

    setError(null);
    setStatus('loading');
    resolvedTokenRef.current = null;

    try {
      const { data } = await withTimeout(client.auth.getSession(), SESSION_INIT_TIMEOUT_MS);
      await applySession(data.session);
    } catch {
      setError(SESSION_LOAD_ERROR_MESSAGE);
      setStatus('error');
    }
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, admin, error, isSigningIn, isConfigured, signIn, signOut, retry }),
    [status, user, admin, error, isSigningIn, isConfigured, signIn, signOut, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
