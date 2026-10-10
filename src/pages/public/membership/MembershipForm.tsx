import { useState } from 'react';
import type { FormEvent } from 'react';
import BackToLanding from './components/BackToLanding';
import GenderField from './components/GenderField';
import InterestField from './components/InterestField';
import MembershipTextField from './components/MembershipTextField';
import { ADULT_AGE_THRESHOLD } from './constants';
import { validateMembershipForm } from './validation';
import type {
  Gender,
  InterestValue,
  MembershipFormErrors,
  MembershipFormValues,
} from './types';

export interface MembershipFormProps {
  readonly onBack: () => void;
}

const EMPTY_VALUES: MembershipFormValues = {
  fullName: '',
  phone: '',
  city: '',
  age: '',
  gender: '',
  interests: [],
  expectations: '',
};

/** Element that receives focus when a given field fails validation. */
const FOCUS_TARGETS: Record<keyof MembershipFormErrors, string> = {
  fullName: 'mem-fullname',
  phone: 'mem-phone',
  city: 'mem-city',
  age: 'mem-age',
  gender: 'mem-gender-male',
  interests: 'mem-interest-0',
};

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
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

function CityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function AgeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M4 21h16" />
      <path d="M5 21v-5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5" />
      <path d="M8 14V9M16 14V9" />
      <path d="M8 9c0-2 1.8-3 4-3s4 1 4 3" />
      <path d="M12 3v1" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

/**
 * Frontend-only electronic membership form.
 *
 * Everything is validated locally. On a valid submission nothing is sent or
 * stored, and the visitor is told clearly that electronic submission is not
 * available yet — no personal data is echoed back or logged.
 */
export default function MembershipForm({ onBack }: MembershipFormProps) {
  const [values, setValues] = useState<MembershipFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<MembershipFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  /** Keys whose controls are plain text/number inputs. */
  type TextField = 'fullName' | 'phone' | 'city' | 'age' | 'expectations';

  function updateField(field: TextField) {
    return (value: string) => {
      setValues((current) => ({ ...current, [field]: value }));
      if (field !== 'expectations') {
        setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
      }
    };
  }

  function handleGenderChange(gender: Gender) {
    setValues((current) => ({ ...current, gender }));
    setErrors((current) => (current.gender ? { ...current, gender: undefined } : current));
  }

  function handleInterestsChange(interests: InterestValue[]) {
    setValues((current) => ({ ...current, interests }));
    setErrors((current) => (current.interests ? { ...current, interests: undefined } : current));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateMembershipForm(values);
    setErrors(nextErrors);

    const firstInvalid = (Object.keys(nextErrors) as (keyof MembershipFormErrors)[])[0];

    if (firstInvalid) {
      const target = document.getElementById(FOCUS_TARGETS[firstInvalid]);
      target?.focus();
      return;
    }

    // Frontend-only: no request is made, nothing is persisted.
    setSubmitted(true);
  }

  function handleReset() {
    setValues(EMPTY_VALUES);
    setErrors({});
  }

  if (submitted) {
    return (
      <section className="section section--default section--pad-default">
        <div className="container">
          <BackToLanding onBack={onBack} />

          <div className="mem-info-card" role="status" aria-live="polite">
            <span className="mem-info-card__icon" aria-hidden="true">
              <InfoIcon />
            </span>
            <h1 className="mem-info-card__title">تم التحقق من المعلومات بنجاح</h1>
            <p className="mem-info-card__text">
              الإرسال الإلكتروني غير متاح حالياً، ولم يتم إرسال طلبك إلى الجمعية.
            </p>
            <p className="mem-info-card__note">
              هذه الواجهة معاينة فقط؛ لن يتم حفظ بياناتك ولا إرسالها إلى أي جهة. يمكنك مراجعة
              الاستمارة أو تعديل معلوماتك.
            </p>
            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={() => setSubmitted(false)}
            >
              العودة للاستمارة وتعديل المعلومات
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section section--default section--pad-default">
      <div className="container">
        <BackToLanding onBack={onBack} />

        <div className="page-hero mem-page-hero">
          <p className="page-hero__eyebrow">الانخراط</p>
          <h1 className="page-hero__title">الانخراط الإلكتروني</h1>
          <p className="page-hero__lead">
            املأ استمارة الانخراط وأخبرنا بميولاتك وانتظاراتك. الحقول المعلّمة بـ{' '}
            <span className="field__required" aria-hidden="true">
              *
            </span>{' '}
            مطلوبة.
          </p>
        </div>

        <div className="mem-form-wrap">
          <form className="mem-form" onSubmit={handleSubmit} noValidate>
            {/* A. Personal information */}
            <fieldset className="mem-section">
              <legend className="mem-section__legend">المعلومات الشخصية</legend>

              <div className="mem-section__body">
                <div className="mem-form__grid">
                  <MembershipTextField
                    id="mem-fullname"
                    name="fullName"
                    label="الاسم الكامل"
                    value={values.fullName}
                    onChange={updateField('fullName')}
                    error={errors.fullName}
                    placeholder="أدخل اسمك الكامل"
                    icon={<UserIcon />}
                    autoComplete="name"
                    required
                  />

                  <MembershipTextField
                    id="mem-phone"
                    name="phone"
                    label="رقم الهاتف"
                    type="tel"
                    inputMode="tel"
                    value={values.phone}
                    onChange={updateField('phone')}
                    error={errors.phone}
                    placeholder="ادخل رقم هاتفك "
                    icon={<PhoneIcon />}
                    autoComplete="tel"
                    required
                  />

                  <MembershipTextField
                    id="mem-city"
                    name="city"
                    label="المدينة"
                    value={values.city}
                    onChange={updateField('city')}
                    error={errors.city}
                    placeholder="أدخل اسم مدينتك"
                    icon={<CityIcon />}
                    autoComplete="address-level2"
                    required
                  />

                  <MembershipTextField
                    id="mem-age"
                    name="age"
                    label="السن"
                    inputMode="numeric"
                    value={values.age}
                    onChange={updateField('age')}
                    error={errors.age}
                    hint={`يُصنّف الانخراط للكبار ابتداءً من ${ADULT_AGE_THRESHOLD} سنة.`}
                    placeholder="أدخل سنك"
                    icon={<AgeIcon />}
                    required
                  />
                </div>

                <GenderField
                  value={values.gender}
                  onChange={handleGenderChange}
                  error={errors.gender}
                />
              </div>
            </fieldset>

            {/* B. Interests */}
            <fieldset className="mem-section">
              <legend className="mem-section__legend">الميولات</legend>
              <div className="mem-section__body">
                <InterestField
                  value={values.interests}
                  onChange={handleInterestsChange}
                  error={errors.interests}
                />
              </div>
            </fieldset>

            {/* C. Expectations */}
            <fieldset className="mem-section">
              <legend className="mem-section__legend">انتظاراتك من الانخراط</legend>
              <div className="mem-section__body">
                <MembershipTextField
                  id="mem-expectations"
                  name="expectations"
                  label="ماذا تتوقع من انخراطك في جمعية شمس؟"
                  value={values.expectations}
                  onChange={updateField('expectations')}
                  placeholder="شاركنا انتظاراتك وكيف ترغب في الاستفادة من أنشطة الجمعية..."
                  multiline
                  rows={6}
                />
              </div>
            </fieldset>

            <div className="mem-form__actions">
              <button type="submit" className="btn btn--primary btn--lg">
                <span className="btn__label">إرسال الاستمارة</span>
              </button>
              <button
                type="button"
                className="btn btn--outline btn--lg"
                onClick={handleReset}
              >
                <span className="btn__label">مسح الحقول</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
