/**
 * Announcement validation — shared by the dashboard form and the admin API.
 *
 * Pure and dependency-free so it can be imported by both the browser bundle and
 * the Node serverless handlers (see the product/Golden Voice precedent).
 */

export type AnnouncementStatus = 'draft' | 'published';

/** Normalised announcement payload used by the create/update endpoints. */
export interface AnnouncementInput {
  title: string;
  body: string;
  imageUrl: string;
  status: AnnouncementStatus;
  /** ISO timestamp, or `null` when no publication date is set. */
  publishedAt: string | null;
}

/** Editable values of the dashboard announcement form. */
export interface AnnouncementFormValues {
  title: string;
  body: string;
  imageUrl: string | null;
  /** Value of a `datetime-local` input (`YYYY-MM-DDTHH:mm`), or `''`. */
  publishedAt: string;
}

export type AnnouncementField = 'title' | 'body' | 'imageUrl' | 'publishedAt' | 'form';

export type AnnouncementErrors = Partial<Record<AnnouncementField, string>>;

export const MAX_TITLE_LENGTH = 200;
export const MAX_BODY_LENGTH = 20000;
export const MAX_IMAGE_URL_LENGTH = 2048;

const INVALID_MESSAGE = 'المرجو التحقق من صحة البيانات المدخلة.';

/**
 * Default publication value for a new announcement: "now", formatted for a
 * `datetime-local` input in the browser's local timezone.
 */
export function defaultPublishedAtInput(now = new Date()): string {
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function emptyAnnouncementForm(): AnnouncementFormValues {
  return {
    title: '',
    body: '',
    imageUrl: null,
    publishedAt: defaultPublishedAtInput(),
  };
}

/**
 * Parse a date-time input/ISO string into an ISO timestamp.
 *
 * Returns `null` for an empty value (meaning "no date set") and `undefined` for
 * a value that cannot be parsed (meaning "invalid").
 */
export function parsePublishedAt(raw: unknown): string | null | undefined {
  if (raw === undefined || raw === null || raw === '') {
    return null;
  }
  if (typeof raw !== 'string') {
    return undefined;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Field-level Arabic validation for a normalised payload. */
export function validateAnnouncementInput(input: AnnouncementInput): AnnouncementErrors {
  const errors: AnnouncementErrors = {};

  if (!input.title) {
    errors.title = 'المرجو إدخال عنوان الإعلان.';
  } else if (input.title.length > MAX_TITLE_LENGTH) {
    errors.title = 'عنوان الإعلان طويل جداً.';
  }

  if (!input.body) {
    errors.body = 'المرجو إدخال نص الإعلان.';
  } else if (input.body.length > MAX_BODY_LENGTH) {
    errors.body = 'نص الإعلان طويل جداً.';
  }

  if (!input.imageUrl) {
    errors.imageUrl = 'المرجو اختيار صورة للإعلان.';
  } else if (input.imageUrl.length > MAX_IMAGE_URL_LENGTH) {
    errors.imageUrl = 'رابط الصورة غير صالح.';
  }

  if (input.publishedAt === undefined) {
    errors.publishedAt = 'تاريخ النشر غير صالح.';
  }

  return errors;
}

/** Convert dashboard form values into a normalised payload plus field errors. */
export function formToAnnouncementInput(
  values: AnnouncementFormValues,
  status: AnnouncementStatus,
): { input: AnnouncementInput; errors: AnnouncementErrors } {
  const errors: AnnouncementErrors = {};

  const parsedDate = parsePublishedAt(values.publishedAt);
  if (parsedDate === undefined) {
    errors.publishedAt = 'تاريخ النشر غير صالح.';
  }

  const body = values.body.replace(/\r\n/g, '\n').trim();

  const input: AnnouncementInput = {
    title: values.title.trim(),
    body,
    imageUrl: values.imageUrl ?? '',
    status,
    publishedAt: parsedDate === undefined ? null : parsedDate,
  };

  return { input, errors: { ...validateAnnouncementInput(input), ...errors } };
}

/** Parse and validate a raw JSON body (server side). */
export function parseAnnouncementBody(body: unknown): {
  input: AnnouncementInput | null;
  errors: AnnouncementErrors;
} {
  if (!body || typeof body !== 'object') {
    return { input: null, errors: { form: INVALID_MESSAGE } };
  }

  const raw = body as Record<string, unknown>;
  const errors: AnnouncementErrors = {};

  const status: AnnouncementStatus = raw.status === 'published' ? 'published' : 'draft';

  const parsedDate = parsePublishedAt(raw.publishedAt);
  if (parsedDate === undefined) {
    errors.publishedAt = 'تاريخ النشر غير صالح.';
  }

  const input: AnnouncementInput = {
    title: typeof raw.title === 'string' ? raw.title.trim() : '',
    body:
      typeof raw.body === 'string' ? raw.body.replace(/\r\n/g, '\n').trim() : '',
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl.trim() : '',
    status,
    publishedAt: parsedDate === undefined ? null : parsedDate,
  };

  return { input, errors: { ...validateAnnouncementInput(input), ...errors } };
}

/** True when there are no field errors. */
export function isAnnouncementValid(errors: AnnouncementErrors): boolean {
  return Object.keys(errors).length === 0;
}
