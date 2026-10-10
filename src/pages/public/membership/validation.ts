import type { MembershipFormErrors, MembershipFormValues } from './types';

/** Digits only: no sign, decimal point or whitespace. */
const AGE_PATTERN = /^\d+$/;

const MIN_FULL_NAME_LENGTH = 3;
const MIN_AGE = 1;
const MAX_AGE = 120;

/**
 * Moroccan landlines and mobiles after normalisation: a leading 0 followed by
 * nine digits in the 05–08 range.
 */
const MOROCCAN_PHONE_PATTERN = /^0[5-8]\d{8}$/;

/** Permissive international fallback: 8 to 15 digits with an optional +. */
const INTERNATIONAL_PHONE_PATTERN = /^\+?\d{8,15}$/;

/**
 * Normalise a Moroccan phone number so equivalent formats validate the same:
 * spaces, dots, dashes and parentheses are ignored, and the international
 * prefixes (+212, 00212, 212) are collapsed to a leading 0.
 */
export function normalizeMoroccanPhone(raw: string): string {
  let value = raw.replace(/[\s().-]/g, '');

  if (value.startsWith('+212')) {
    value = `0${value.slice(4)}`;
  } else if (value.startsWith('00212')) {
    value = `0${value.slice(5)}`;
  } else if (value.startsWith('212')) {
    value = `0${value.slice(3)}`;
  }

  return value;
}

export function isValidMoroccanPhone(raw: string): boolean {
  return MOROCCAN_PHONE_PATTERN.test(normalizeMoroccanPhone(raw.trim()));
}

/**
 * A phone number is accepted when it matches the Moroccan format or a
 * plausible international format, so valid foreign numbers are not rejected.
 */
export function isValidPhone(raw: string): boolean {
  const trimmed = raw.trim();

  if (!trimmed) {
    return false;
  }

  if (isValidMoroccanPhone(trimmed)) {
    return true;
  }

  const compact = trimmed.replace(/[\s().-]/g, '');

  // Local-style numbers (a leading 0 without a country code) must match the
  // Moroccan format; only non-local values fall back to the international check.
  if (compact.startsWith('0')) {
    return false;
  }

  return INTERNATIONAL_PHONE_PATTERN.test(compact);
}

/** True when a numeric age is within the accepted human range. */
export function isValidAge(raw: string): boolean {
  const value = raw.trim();

  if (!AGE_PATTERN.test(value)) {
    return false;
  }

  const age = Number(value);
  return age >= MIN_AGE && age <= MAX_AGE;
}

/**
 * Validate the whole membership form. Contributes an error per invalid field,
 * in submission order, so the caller can focus the first invalid control.
 */
export function validateMembershipForm(
  values: MembershipFormValues,
): MembershipFormErrors {
  const errors: MembershipFormErrors = {};

  const fullName = values.fullName.trim();
  if (!fullName) {
    errors.fullName = 'المرجو إدخال الاسم الكامل.';
  } else if (fullName.length < MIN_FULL_NAME_LENGTH) {
    errors.fullName = 'المرجو إدخال اسم كامل صحيح.';
  }

  const phone = values.phone.trim();
  if (!phone) {
    errors.phone = 'المرجو إدخال رقم الهاتف.';
  } else if (!isValidPhone(phone)) {
    errors.phone = 'المرجو إدخال رقم هاتف صحيح.';
  }

  if (!values.city.trim()) {
    errors.city = 'المرجو إدخال اسم المدينة.';
  }

  const age = values.age.trim();
  if (!age) {
    errors.age = 'المرجو إدخال السن.';
  } else if (!AGE_PATTERN.test(age)) {
    errors.age = 'المرجو إدخال السن بالأرقام فقط.';
  } else if (!isValidAge(age)) {
    errors.age = `المرجو إدخال سن صحيح بين ${MIN_AGE} و${MAX_AGE}.`;
  }

  if (!values.gender) {
    errors.gender = 'المرجو اختيار الجنس.';
  }

  if (values.interests.length === 0) {
    errors.interests = 'المرجو اختيار مجال واحد على الأقل.';
  }

  return errors;
}
