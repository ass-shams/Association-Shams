import type { ReactNode } from 'react';
import { useAuth } from './useAuth';
import LoginPage from './LoginPage';

function CenteredPanel({ children }: { children: ReactNode }) {
  return (
    <div className="dash-auth" dir="rtl">
      <div className="dash-auth__card">{children}</div>
    </div>
  );
}

function LoadingPanel() {
  return (
    <CenteredPanel>
      <div className="dash-auth__status" role="status" aria-live="polite">
        <span className="btn__spinner" aria-hidden="true" />
        <p className="dash-auth__text">جارٍ التحقق من الجلسة…</p>
      </div>
    </CenteredPanel>
  );
}

function UnauthorizedPanel() {
  const { user, error, retry, signOut } = useAuth();

  return (
    <CenteredPanel>
      <h1 className="dash-auth__title">غير مصرح</h1>
      <p className="dash-auth__text">
        {error ?? 'هذا الحساب غير مصرح له بالوصول إلى لوحة التحكم.'}
      </p>
      {user?.email ? <p className="dash-auth__email">{user.email}</p> : null}
      <div className="dash-auth__actions">
        <button
          type="button"
          className="btn btn--primary btn--md"
          onClick={() => void retry()}
        >
          <span className="btn__label">إعادة المحاولة</span>
        </button>
        <button
          type="button"
          className="btn btn--outline btn--md"
          onClick={() => void signOut()}
        >
          <span className="btn__label">تسجيل الخروج</span>
        </button>
      </div>
    </CenteredPanel>
  );
}

function ErrorPanel() {
  const { error, retry, signOut } = useAuth();

  return (
    <CenteredPanel>
      <h1 className="dash-auth__title">تعذّر التحقق</h1>
      <p className="dash-auth__text">
        {error ?? 'تعذّر التحقق من الجلسة. المرجو المحاولة مرة أخرى.'}
      </p>
      <div className="dash-auth__actions">
        <button
          type="button"
          className="btn btn--primary btn--md"
          onClick={() => void retry()}
        >
          <span className="btn__label">إعادة المحاولة</span>
        </button>
        <button
          type="button"
          className="btn btn--outline btn--md"
          onClick={() => void signOut()}
        >
          <span className="btn__label">تسجيل الخروج</span>
        </button>
      </div>
    </CenteredPanel>
  );
}

/**
 * Renders `children` only for an authenticated, allowlisted administrator.
 *
 * This gate exists for UX only. It must never be the sole access control:
 * server endpoints enforce authorization independently via `requireAdmin`.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return <LoadingPanel />;
  }

  /*
   * Both `unauthenticated` and `unconfigured` show the login page. A missing
   * Supabase configuration is surfaced as an inline notice by `LoginPage`
   * instead of replacing the form, so the login UI is always reachable.
   */
  if (status === 'unauthenticated' || status === 'unconfigured') {
    return <LoginPage />;
  }

  if (status === 'unauthorized') {
    return <UnauthorizedPanel />;
  }

  if (status === 'error') {
    return <ErrorPanel />;
  }

  return <>{children}</>;
}
