import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';
import LoginPage from './LoginPage';

function render(overrides: Partial<AuthContextValue>): string {
  const context: AuthContextValue = {
    status: 'unauthenticated',
    user: null,
    admin: null,
    error: null,
    isSigningIn: false,
    isConfigured: true,
    signIn: async () => undefined,
    signOut: async () => undefined,
    retry: async () => undefined,
    ...overrides,
  };

  return renderToStaticMarkup(
    <AuthContext.Provider value={context}>
      <LoginPage />
    </AuthContext.Provider>,
  );
}

describe('LoginPage', () => {
  it('renders the email and password fields with a submit button', () => {
    const html = render({});

    expect(html).toContain('type="email"');
    expect(html).toContain('type="password"');
    expect(html).toContain('تسجيل الدخول');
    expect(html).not.toContain('إعداد الاتصال غير مكتمل');
  });

  it('keeps the login form and adds a setup notice when unconfigured', () => {
    const html = render({ status: 'unconfigured', isConfigured: false });

    expect(html).toContain('type="email"');
    expect(html).toContain('type="password"');
    expect(html).toContain('إعداد الاتصال غير مكتمل');
  });

  it('surfaces an authentication error message', () => {
    const html = render({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });

    expect(html).toContain('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  });
});
