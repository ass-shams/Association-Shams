import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';
import RequireAuth from './RequireAuth';

function render(status: AuthContextValue['status']): string {
  const context: AuthContextValue = {
    status,
    user: status === 'unauthorized' ? { id: 'u', email: 'user@example.com' } : null,
    admin: status === 'authenticated' ? { id: 'a', email: 'admin@example.com' } : null,
    error: status === 'error' ? 'تعذّر الوصول إلى خدمة التحقق.' : null,
    isSigningIn: false,
    isConfigured: true,
    signIn: async () => undefined,
    signOut: async () => undefined,
    retry: async () => undefined,
  };

  return renderToStaticMarkup(
    <AuthContext.Provider value={context}>
      <RequireAuth>
        <div>PROTECTED_CONTENT</div>
      </RequireAuth>
    </AuthContext.Provider>,
  );
}

describe('RequireAuth', () => {
  it('shows the loading state and does not render protected content', () => {
    const html = render('loading');
    expect(html).toContain('جارٍ التحقق من الجلسة');
    expect(html).not.toContain('PROTECTED_CONTENT');
  });

  it('leaves loading on error and offers a retry', () => {
    const html = render('error');
    expect(html).toContain('تعذّر التحقق');
    expect(html).toContain('إعادة المحاولة');
    expect(html).not.toContain('جارٍ التحقق من الجلسة');
    expect(html).not.toContain('PROTECTED_CONTENT');
  });

  it('shows the login form when unauthenticated', () => {
    const html = render('unauthenticated');
    expect(html).toContain('تسجيل الدخول');
    expect(html).not.toContain('PROTECTED_CONTENT');
  });

  it('blocks non-admin users and offers a retry', () => {
    const html = render('unauthorized');
    expect(html).toContain('غير مصرح');
    expect(html).toContain('إعادة المحاولة');
    expect(html).not.toContain('PROTECTED_CONTENT');
  });

  it('renders protected content only for an authenticated admin', () => {
    const html = render('authenticated');
    expect(html).toContain('PROTECTED_CONTENT');
  });
});
