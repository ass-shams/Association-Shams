import {
  ACCEPTED_VIDEO_EXTENSIONS,
  ACCEPTED_VIDEO_MIME_TYPES,
  OTHER_REGION,
  REGION_OPTIONS,
  VIDEO_MAX_DURATION_SECONDS,
} from './constants.js';
import type { RegionValue } from './constants.js';
import type { RegistrationErrors, RegistrationValues } from './types.js';

/** Digits-only age, no sign, decimal point or whitespace. */
const AGE_PATTERN = /^\d+$/;

/** Arabic messages shared by the browser form and the serverless endpoints. */
export const VIDEO_REQUIRED_MESSAGE = 'المرجو رفع فيديو المشاركة.';
export const VIDEO_TOO_LONG_MESSAGE = 'مدة الفيديو تتجاوز الحد المسموح به.';
export const VIDEO_UNREADABLE_MESSAGE = 'تعذّر قراءة الفيديو. المرجو اختيار ملف فيديو صالح.';
export const VIDEO_FORMAT_MESSAGE = 'صيغة الفيديو غير مدعومة. الصيغ المدعومة: MP4 أو WebM.';
export const VIDEO_SIZE_MESSAGE = 'حجم الفيديو كبير جدًا. المرجو اختيار ملف أصغر.';
export const VIDEO_NOT_FOUND_MESSAGE = 'تعذّر العثور على الفيديو المرفوع. المرجو المحاولة من جديد.';
export const VIDEO_DURATION_UNVERIFIABLE_MESSAGE =
  'تعذّر التحقق من مدة الفيديو. المرجو اختيار ملف بصيغة MP4 أو WebM.';

/**
 * Moroccan phone numbers after normalisation: a leading 0 followed by nine
 * digits, starting with the 05, 06, 07 or 08 range.
 */
const MOROCCAN_PHONE_PATTERN = /^0[5-8]\d{8}$/;

const MIN_FULL_NAME_LENGTH = 3;

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

/** Validate every non-conditional field of the registration form. */
export function validateRegistration(values: RegistrationValues): RegistrationErrors {
  const errors: RegistrationErrors = {};

  const fullName = values.fullName.trim();
  if (!fullName) {
    errors.fullName = 'المرجو إدخال الاسم الكامل.';
  } else if (fullName.length < MIN_FULL_NAME_LENGTH) {
    errors.fullName = 'المرجو إدخال اسم كامل صحيح.';
  }

  const phone = values.phone.trim();
  if (!phone) {
    errors.phone = 'المرجو إدخال رقم الهاتف.';
  } else if (!isValidMoroccanPhone(phone)) {
    errors.phone = 'المرجو إدخال رقم هاتف مغربي صحيح.';
  }

  const age = values.age.trim();
  if (!age) {
    errors.age = 'المرجو إدخال السن.';
  } else if (!AGE_PATTERN.test(age)) {
    errors.age = 'المرجو إدخال السن بالأرقام فقط.';
  } else if (Number(age) < 1) {
    errors.age = 'المرجو إدخال سن صحيح.';
  }

  if (!values.city.trim()) {
    errors.city = 'المرجو إدخال اسم المدينة.';
  }

  if (!values.region) {
    errors.region = 'المرجو اختيار الجهة.';
  }

  return errors;
}

/** A video is required only for participants outside Beni Mellal-Khenifra. */
export function isVideoRequired(region: RegionValue | ''): boolean {
  return region === OTHER_REGION;
}

/** True when the value is one of the approved region identifiers. */
export function isRegionValue(value: unknown): value is RegionValue {
  return (
    typeof value === 'string' && REGION_OPTIONS.some((option) => option.value === value)
  );
}

/** True when the MIME type is one the server can inspect and verify. */
export function isAcceptedVideoMime(mime: string): boolean {
  return (ACCEPTED_VIDEO_MIME_TYPES as readonly string[]).includes(mime.trim().toLowerCase());
}

/** Lower-case file extension without the dot, or an empty string. */
export function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf('.');
  return index >= 0 ? fileName.slice(index + 1).toLowerCase() : '';
}

/**
 * Client-side convenience check used for immediate feedback. The server never
 * trusts the browser MIME type and re-validates the uploaded bytes.
 */
export function isAcceptedVideoFile(fileName: string, mimeType: string): boolean {
  if (isAcceptedVideoMime(mimeType)) {
    return true;
  }

  return (ACCEPTED_VIDEO_EXTENSIONS as readonly string[]).includes(getFileExtension(fileName));
}

/** Browser metadata is trusted only for a finite, positive duration within the limit. */
export function isVideoDurationValid(durationSeconds: number): boolean {
  return (
    Number.isFinite(durationSeconds) &&
    durationSeconds > 0 &&
    durationSeconds <= VIDEO_MAX_DURATION_SECONDS
  );
}

/** Format seconds as m:ss for display next to the selected file. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

/** Human-readable byte size using Arabic units. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 بايت';
  }

  const units = ['بايت', 'كيلوبايت', 'ميغابايت', 'غيغابايت'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  const formatted = exponent === 0 ? String(value) : value.toFixed(1);

  return `${formatted} ${units[exponent]}`;
}
