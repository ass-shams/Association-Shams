import { useState } from 'react';
import type { FormEvent } from 'react';
import FinalCTA from '@/components/finalCTA';

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

const CONTACT_INFO = [
  { label: 'الهاتف', value: 'قيد التحديث', icon: PhoneIcon },
  { label: 'البريد الإلكتروني', value: 'قيد التحديث', icon: MailIcon },
  { label: 'العنوان', value: 'قيد التحديث', icon: LocationIcon },
];

interface FormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = { name: '', email: '', subject: '', message: '' };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'يرجى إدخال الاسم الكامل.';
  }

  if (!values.email.trim()) {
    errors.email = 'يرجى إدخال البريد الإلكتروني.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'صيغة البريد الإلكتروني غير صحيحة.';
  }

  if (!values.subject.trim()) {
    errors.subject = 'يرجى إدخال موضوع الرسالة.';
  }

  if (!values.message.trim()) {
    errors.message = 'يرجى إدخال نص الرسالة.';
  }

  return errors;
}

export default function ContactPage() {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const updateField = (field: keyof FormValues) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setStatus('submitting');
    window.setTimeout(() => setStatus('success'), 800);
  };

  const handleReset = () => {
    setValues(EMPTY_FORM);
    setErrors({});
    setStatus('idle');
  };

  const isSubmitting = status === 'submitting';

  return (
    <>
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="page-hero">
            <p className="page-hero__eyebrow">اتصل بنا</p>
            <h1 className="page-hero__title">تواصل معنا</h1>
            <p className="page-hero__lead">
              نحن هنا للاستماع إليك. سواء كان لديك استفسار أو اقتراح، أو ترغب في معرفة المزيد عن
              برامج الجمعية، يرجى عدم التردد في مراسلتنا، وسنرد عليك في أقرب وقت ممكن.
            </p>
          </div>
        </div>
      </section>

      {/* Contact information */}
      <section className="section section--muted section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">معلومات التواصل</h2>
          </div>
          <div className="grid grid--240">
            {CONTACT_INFO.map((item) => (
              <div key={item.label} className="card card--fill">
                <div className="card__header">
                  <span className="icon-tile" aria-hidden="true">
                    <item.icon />
                  </span>
                  <h3 className="card-title">{item.label}</h3>
                </div>
                <div className="card__body">
                  <p className="card-text">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="contact-form-wrap">
            <div className="section-heading">
              <h2 className="section-heading__title">أرسل لنا رسالة</h2>
              <p className="section-heading__lead">املأ النموذج أدناه وسنعود إليك في أقرب وقت ممكن.</p>
            </div>

            {status === 'success' ? (
              <div className="contact-success" role="status">
                <span className="contact-success__icon" aria-hidden="true">
                  <CheckIcon />
                </span>
                <h3 className="contact-success__title">تم إرسال رسالتك بنجاح</h3>
                <p className="contact-success__text">
                  شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.
                </p>
                <button type="button" className="btn btn--outline btn--md" onClick={handleReset}>
                  إرسال رسالة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form" noValidate>
                <div className="grid">
                  <div className="field">
                    <label className="field__label" htmlFor="contact-name">
                      الاسم الكامل
                      <span className="field__required" aria-hidden="true">
                        *
                      </span>
                    </label>
                    <input
                      className="input"
                      id="contact-name"
                      type="text"
                      name="name"
                      autoComplete="name"
                      value={values.name}
                      aria-invalid={errors.name ? true : undefined}
                      onChange={(event) => updateField('name')(event.target.value)}
                      disabled={isSubmitting}
                    />
                    {errors.name ? <p className="field__message field__error">{errors.name}</p> : null}
                  </div>

                  <div className="field">
                    <label className="field__label" htmlFor="contact-email">
                      البريد الإلكتروني
                      <span className="field__required" aria-hidden="true">
                        *
                      </span>
                    </label>
                    <input
                      className="input"
                      id="contact-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={values.email}
                      aria-invalid={errors.email ? true : undefined}
                      onChange={(event) => updateField('email')(event.target.value)}
                      disabled={isSubmitting}
                    />
                    {errors.email ? (
                      <p className="field__message field__error">{errors.email}</p>
                    ) : null}
                  </div>

                  <div className="field">
                    <label className="field__label" htmlFor="contact-subject">
                      الموضوع
                      <span className="field__required" aria-hidden="true">
                        *
                      </span>
                    </label>
                    <input
                      className="input"
                      id="contact-subject"
                      type="text"
                      name="subject"
                      value={values.subject}
                      aria-invalid={errors.subject ? true : undefined}
                      onChange={(event) => updateField('subject')(event.target.value)}
                      disabled={isSubmitting}
                    />
                    {errors.subject ? (
                      <p className="field__message field__error">{errors.subject}</p>
                    ) : null}
                  </div>

                  <div className="field">
                    <label className="field__label" htmlFor="contact-message">
                      الرسالة
                      <span className="field__required" aria-hidden="true">
                        *
                      </span>
                    </label>
                    <textarea
                      className="textarea"
                      id="contact-message"
                      name="message"
                      rows={5}
                      value={values.message}
                      aria-invalid={errors.message ? true : undefined}
                      onChange={(event) => updateField('message')(event.target.value)}
                      disabled={isSubmitting}
                    />
                    {errors.message ? (
                      <p className="field__message field__error">{errors.message}</p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn--primary btn--lg contact-form__submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <span className="btn__spinner" aria-hidden="true" /> : null}
                  <span className="btn__label">إرسال الرسالة</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Working hours */}
      <section className="section section--muted section--pad-tight">
        <div className="container">
          <div className="card hours-card">
            <div className="card__body hours-card__body">
              <span className="icon-tile" aria-hidden="true">
                <ClockIcon />
              </span>
              <div>
                <h2 className="hours-card__title">أوقات العمل</h2>
                <p className="hours-card__text">من الاثنين إلى الجمعة، 9:00 - 17:00</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Help CTA */}
      <FinalCTA
        title="كيف يمكننا مساعدتك؟"
        text="سواء كنت تبحث عن الانخراط في الجمعية، أو تريد الاطلاع على أنشطتنا، أو لديك أي استفسار آخر، نحن هنا لنرشدك إلى الوجهة المناسبة."
      />
    </>
  );
}
