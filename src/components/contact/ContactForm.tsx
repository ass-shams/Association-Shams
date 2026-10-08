import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import FormField from '@/components/contact/FormField';
import TurnstileWidget from '@/components/contact/TurnstileWidget';
import type { TurnstileWidgetHandle } from '@/components/contact/TurnstileWidget';
import { submitContactMessage } from '@/data/contactService';
import type { ContactMessage } from '@/data/contactService';

type Status = 'idle' | 'submitting' | 'success' | 'error';

type FormErrors = Partial<Record<keyof ContactMessage, string>>;

const EMPTY_FORM: ContactMessage = { name: '', email: '', phone: '', subject: '', message: '' };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: ContactMessage): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'المرجو إدخال الاسم الكامل';
  }

  if (!values.email.trim()) {
    errors.email = 'المرجو إدخال بريدك الإلكتروني';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'المرجو إدخال بريد إلكتروني صحيح';
  }

  if (!values.message.trim()) {
    errors.message = 'المرجو كتابة رسالتك';
  }

  return errors;
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V4.4A1.6 1.6 0 0 1 4.4 2.8H12a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1.4" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Contact form with validation, loading, success and error states. */
export default function ContactForm() {
  const [values, setValues] = useState<ContactMessage>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState('');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  function updateField(field: keyof ContactMessage) {
    return (value: string) => {
      setValues((current) => ({ ...current, [field]: value }));
      setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    };
  }

  function resetTurnstile() {
    setTurnstileToken('');
    turnstileRef.current?.reset();
  }

  function handleTurnstileVerify(token: string) {
    setTurnstileToken(token);
    setTurnstileError('');
  }

  function handleTurnstileExpire() {
    setTurnstileToken('');
  }

  function handleTurnstileError() {
    setTurnstileToken('');
    setTurnstileError('تعذّر إكمال التحقق. المرجو المحاولة مرة أخرى.');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!turnstileToken) {
      setTurnstileError('المرجو إكمال التحقق قبل إرسال الرسالة');
      return;
    }

    setTurnstileError('');
    setStatus('submitting');

    try {
      await submitContactMessage(values);
      setStatus('success');
      resetTurnstile();
    } catch {
      setStatus('error');
      resetTurnstile();
    }
  }

  function handleReset() {
    setValues(EMPTY_FORM);
    setErrors({});
    setStatus('idle');
    setTurnstileToken('');
    setTurnstileError('');
  }

  const isSubmitting = status === 'submitting';

  if (status === 'success') {
    return (
      <div className="contact-card">
        <div className="contact-success" role="status">
          <span className="contact-success__icon" aria-hidden="true">
            <CheckIcon />
          </span>
          <h2 className="contact-success__title">تم إرسال رسالتك بنجاح</h2>
          <p className="contact-success__text">
            شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.
          </p>
          <button type="button" className="btn btn--outline btn--md" onClick={handleReset}>
            إرسال رسالة أخرى
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-card">
      <div className="contact-card__head">
        <h2 className="contact-card__title">أرسل لنا رسالة</h2>
        <p className="contact-card__lead">املأ النموذج وسنتواصل معك في أقرب وقت ممكن.</p>
      </div>

      {status === 'error' ? (
        <p className="form-alert" role="alert">
          حدث خطأ أثناء إرسال الرسالة. المرجو المحاولة مرة أخرى.
        </p>
      ) : null}

      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <div className="contact-form__grid">
          <FormField
            id="contact-name"
            name="name"
            label="الاسم الكامل"
            placeholder="عزالدين."
            icon={<UserIcon />}
            value={values.name}
            onChange={updateField('name')}
            error={errors.name}
            autoComplete="name"
            required
            disabled={isSubmitting}
          />
          <FormField
            id="contact-email"
            name="email"
            label="البريد الإلكتروني"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            icon={<MailIcon />}
            value={values.email}
            onChange={updateField('email')}
            error={errors.email}
            required
            disabled={isSubmitting}
          />
          <FormField
            id="contact-phone"
            name="phone"
            label="رقم الهاتف"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+212 6XX XXX XXX"
            icon={<PhoneIcon />}
            value={values.phone}
            onChange={updateField('phone')}
            error={errors.phone}
            disabled={isSubmitting}
          />
          <FormField
            id="contact-subject"
            name="subject"
            label="الموضوع"
            placeholder="استفسار حول الانخراط"
            icon={<TagIcon />}
            value={values.subject}
            onChange={updateField('subject')}
            error={errors.subject}
            disabled={isSubmitting}
          />
          <FormField
            id="contact-message"
            name="message"
            label="الرسالة"
            placeholder="اكتب رسالتك هنا..."
            icon={<MessageIcon />}
            value={values.message}
            onChange={updateField('message')}
            error={errors.message}
            multiline
            rows={1}
            required
            fullWidth
            disabled={isSubmitting}
          />
        </div>

        <div className="turnstile-row">
          <TurnstileWidget
            ref={turnstileRef}
            onVerify={handleTurnstileVerify}
            onExpire={handleTurnstileExpire}
            onError={handleTurnstileError}
          />
          {turnstileError ? (
            <p className="field__message field__error">{turnstileError}</p>
          ) : null}
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--lg contact-form__submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? <span className="btn__spinner" aria-hidden="true" /> : null}
          <span className="btn__label">{isSubmitting ? 'جارٍ الإرسال…' : 'إرسال الرسالة'}</span>
        </button>
      </form>
    </div>
  );
}
