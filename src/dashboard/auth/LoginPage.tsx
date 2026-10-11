import { useState } from 'react';
import type { FormEvent } from 'react';
import logo from '@/assets/navbar-footer.png';
import { useDocumentTitle } from '@/lib/documentTitle';
import { useAuth } from './useAuth';

const REQUIRED_MESSAGE = 'المرجو إدخال البريد الإلكتروني وكلمة المرور.';

const UNCONFIGURED_TITLE = 'إعداد الاتصال غير مكتمل';
const UNCONFIGURED_MESSAGE =
  'لم يتم ضبط متغيرات الاتصال بقاعدة البيانات محلياً. أنشئ ملف .env.local بالقيم المناسبة ثم أعد تشغيل خادم التطوير.';

/**
 * Dashboard sign-in page (email + password).
 *
 * There is intentionally no public sign-up: accounts and administrator
 * authorization are managed outside the browser. Only existing credentials can
 * be used here.
 */
export default function LoginPage() {
  useDocumentTitle('تسجيل الدخول');
  const { status, error, isSigningIn, isConfigured, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const message = fieldError ?? error;
  const isSubmitDisabled = isSigningIn || status === 'loading' || !isConfigured;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setFieldError(REQUIRED_MESSAGE);
      return;
    }

    setFieldError(null);
    await signIn(trimmedEmail, password);
  }

  return (
    <div className="dash-auth" dir="rtl">
      <main className="dash-auth__card">
        <div className="dash-auth__brand">
          <img className="dash-auth__logo" src={logo} alt="جمعية شمس" />
          <p className="dash-auth__brand-name">لوحة تحكم جمعية شمس</p>
        </div>

        <div className="dash-auth__head">
          <h1 className="dash-auth__title">تسجيل الدخول</h1>
          <p className="dash-auth__lead">أدخل بيانات حساب المسؤول للوصول إلى لوحة التحكم.</p>
        </div>

        {!isConfigured ? (
          <div className="dash-auth__notice" role="status">
            <p className="dash-auth__notice-title">{UNCONFIGURED_TITLE}</p>
            <p className="dash-auth__notice-text">{UNCONFIGURED_MESSAGE}</p>
          </div>
        ) : null}

        {message ? (
          <p className="form-alert" role="alert">
            {message}
          </p>
        ) : null}

        <form className="dash-auth__form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="dash-email">
              البريد الإلكتروني
            </label>
            <input
              id="dash-email"
              name="email"
              className="input"
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="admin@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (fieldError) {
                  setFieldError(null);
                }
              }}
              disabled={isSigningIn}
              required
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="dash-password">
              كلمة المرور
            </label>
            <input
              id="dash-password"
              name="password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldError) {
                  setFieldError(null);
                }
              }}
              disabled={isSigningIn}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--lg btn--full"
            disabled={isSubmitDisabled}
          >
            {isSigningIn ? <span className="btn__spinner" aria-hidden="true" /> : null}
            <span className="btn__label">{isSigningIn ? 'جارٍ تسجيل الدخول…' : 'دخول'}</span>
          </button>
        </form>
      </main>
    </div>
  );
}
