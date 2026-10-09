import { useState } from 'react';
import type { FormEvent } from 'react';
import RegistrationField from './RegistrationField';
import RegionField from './RegionField';
import VideoUploadField from './VideoUploadField';
import { OTHER_REGION } from '../constants';
import type { RegionValue } from '../constants';
import { GENERIC_SUBMIT_ERROR, submitGoldenVoiceRegistration } from '../registrationService';
import { validateRegistration, VIDEO_REQUIRED_MESSAGE } from '../validation';
import type { RegistrationErrors, RegistrationValues, SelectedVideo } from '../types';

const EMPTY_VALUES: RegistrationValues = {
  fullName: '',
  phone: '',
  age: '',
  city: '',
  region: '',
};

type SubmitStatus = 'idle' | 'submitting';

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

function CityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
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

/**
 * Registration form for the Golden Voice competition.
 *
 * Validates client-side for immediate feedback, then delegates the secure
 * submission (signed video upload + database insert) to the serverless
 * endpoints through `submitGoldenVoiceRegistration`. Entered values are kept
 * when submission fails, and the form is only cleared after success.
 */
export default function GoldenVoiceRegistrationForm() {
  const [values, setValues] = useState<RegistrationValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [video, setVideo] = useState<SelectedVideo | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [submitError, setSubmitError] = useState('');

  const isOtherRegion = values.region === OTHER_REGION;
  const isSubmitting = status === 'submitting';

  function updateField(field: keyof RegistrationValues) {
    return (value: string) => {
      setValues((current) => ({ ...current, [field]: value }));
      setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    };
  }

  function handleRegionChange(region: RegionValue) {
    setValues((current) => ({ ...current, region }));
    setErrors((current) => {
      const next: RegistrationErrors = { ...current, region: undefined };
      if (region !== OTHER_REGION) {
        next.video = undefined;
      }
      return next;
    });

    if (region !== OTHER_REGION) {
      setVideo(null);
    }
  }

  function handleVideoChange(next: SelectedVideo | null) {
    setVideo(next);
    setErrors((current) => (current.video ? { ...current, video: undefined } : current));
  }

  function handleVideoError(message: string) {
    setErrors((current) => ({ ...current, video: message || undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validateRegistration(values);

    if (isOtherRegion && !video && !nextErrors.video) {
      nextErrors.video = VIDEO_REQUIRED_MESSAGE;
    }

    setErrors(nextErrors);
    setSubmitError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setStatus('submitting');

    try {
      await submitGoldenVoiceRegistration(
        {
          fullName: values.fullName.trim(),
          phone: values.phone.trim(),
          age: Number(values.age),
          city: values.city.trim(),
          region: values.region as RegionValue,
        },
        video,
      );

      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error && error.message ? error.message : GENERIC_SUBMIT_ERROR);
    } finally {
      setStatus('idle');
    }
  }

  function handleReset() {
    setValues(EMPTY_VALUES);
    setErrors({});
    setVideo(null);
    setSubmitted(false);
    setStatus('idle');
    setSubmitError('');
  }

  if (submitted) {
    return (
      <div className="gv-card">
        <div className="gv-success" role="status">
          <span className="gv-success__icon" aria-hidden="true">
            <CheckIcon />
          </span>
          <h2 className="gv-success__title">تم التحقق من صحة المعلومات</h2>
          <p className="gv-success__text">
            تم التحقق من صحة المعلومات. سيتم تفعيل التسجيل الفعلي في مرحلة لاحقة.
          </p>
          <button type="button" className="btn btn--outline btn--md" onClick={handleReset}>
            تعديل الطلب
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="gv-card gv-form" onSubmit={handleSubmit} noValidate>
      {submitError ? (
        <p className="form-alert" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="gv-form__grid">
        <RegistrationField
          id="gv-fullname"
          name="fullName"
          label="الاسم الكامل"
          placeholder="أدخل اسمك الكامل"
          icon={<UserIcon />}
          autoComplete="name"
          value={values.fullName}
          onChange={updateField('fullName')}
          error={errors.fullName}
          disabled={isSubmitting}
          required
        />
        <RegistrationField
          id="gv-phone"
          name="phone"
          label="رقم الهاتف"
          type="tel"
          inputMode="tel"
          placeholder="أدخل رقم هاتفك"
          icon={<PhoneIcon />}
          autoComplete="tel"
          value={values.phone}
          onChange={updateField('phone')}
          error={errors.phone}
          disabled={isSubmitting}
          required
        />
        <RegistrationField
          id="gv-age"
          name="age"
          label="السن"
          inputMode="numeric"
          placeholder="أدخل سنك"
          icon={<AgeIcon />}
          value={values.age}
          onChange={updateField('age')}
          error={errors.age}
          disabled={isSubmitting}
          required
        />
        <RegistrationField
          id="gv-city"
          name="city"
          label="المدينة"
          placeholder="أدخل اسم مدينتك"
          icon={<CityIcon />}
          autoComplete="address-level2"
          value={values.city}
          onChange={updateField('city')}
          error={errors.city}
          disabled={isSubmitting}
          required
        />
      </div>

      <RegionField
        value={values.region}
        onChange={handleRegionChange}
        error={errors.region}
        disabled={isSubmitting}
      />

      {isOtherRegion ? (
        <VideoUploadField
          value={video}
          onChange={handleVideoChange}
          onErrorChange={handleVideoError}
          error={errors.video}
          disabled={isSubmitting}
        />
      ) : null}

      <div className="gv-form__actions">
        <button
          type="submit"
          className="btn btn--primary btn--lg gv-form__submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? <span className="btn__spinner" aria-hidden="true" /> : null}
          <span className="btn__label">
            {isSubmitting ? 'جارٍ إرسال الطلب…' : 'إرسال طلب المشاركة'}
          </span>
        </button>
      </div>
    </form>
  );
}
