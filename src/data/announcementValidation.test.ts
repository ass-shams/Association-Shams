import { describe, expect, it } from 'vitest';
import {
  defaultPublishedAtInput,
  emptyAnnouncementForm,
  formToAnnouncementInput,
  isAnnouncementValid,
  parseAnnouncementBody,
  parsePublishedAt,
  validateAnnouncementInput,
} from './announcementValidation';
import type { AnnouncementInput } from './announcementValidation';

const VALID_IMAGE =
  'https://proj.supabase.co/storage/v1/object/public/announcement-images/announcements/x.jpg';

const VALID_INPUT: AnnouncementInput = {
  title: 'إعلان',
  body: 'نص الإعلان.',
  imageUrl: VALID_IMAGE,
  status: 'published',
  publishedAt: '2026-01-01T10:00:00.000Z',
};

describe('parsePublishedAt', () => {
  it('returns null for an empty value', () => {
    expect(parsePublishedAt('')).toBeNull();
    expect(parsePublishedAt(null)).toBeNull();
  });

  it('parses a valid date into an ISO string', () => {
    expect(parsePublishedAt('2026-01-01T10:00')).toMatch(/^2026-01-01T/);
  });

  it('returns undefined for an unparseable value', () => {
    expect(parsePublishedAt('not-a-date')).toBeUndefined();
    expect(parsePublishedAt(42)).toBeUndefined();
  });
});

describe('defaultPublishedAtInput', () => {
  it('returns a datetime-local shaped string', () => {
    expect(defaultPublishedAtInput(new Date('2026-05-05T12:34:00Z'))).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    );
  });
});

describe('validateAnnouncementInput', () => {
  it('accepts a complete payload', () => {
    expect(isAnnouncementValid(validateAnnouncementInput(VALID_INPUT))).toBe(true);
  });

  it('requires title, body and image', () => {
    const errors = validateAnnouncementInput({
      ...VALID_INPUT,
      title: '',
      body: '',
      imageUrl: '',
    });
    expect(errors.title).toBeDefined();
    expect(errors.body).toBeDefined();
    expect(errors.imageUrl).toBeDefined();
  });
});

describe('formToAnnouncementInput', () => {
  it('normalises a valid form', () => {
    const { input, errors } = formToAnnouncementInput(
      {
        title: '  إعلان  ',
        body: 'سطر أول\r\nسطر ثان',
        imageUrl: VALID_IMAGE,
        publishedAt: '2026-01-01T10:00',
      },
      'draft',
    );

    expect(isAnnouncementValid(errors)).toBe(true);
    expect(input.title).toBe('إعلان');
    expect(input.body).toBe('سطر أول\nسطر ثان');
    expect(input.status).toBe('draft');
    expect(input.publishedAt).toMatch(/^2026-01-01T/);
  });

  it('reports an invalid publication date', () => {
    const { errors } = formToAnnouncementInput(
      { ...emptyAnnouncementForm(), publishedAt: 'nope' },
      'published',
    );
    expect(errors.publishedAt).toBeDefined();
  });
});

describe('parseAnnouncementBody', () => {
  it('parses a raw payload', () => {
    const { input, errors } = parseAnnouncementBody(VALID_INPUT);
    expect(errors).toEqual({});
    expect(input).not.toBeNull();
    expect(input?.status).toBe('published');
  });

  it('defaults an unknown status to draft', () => {
    const { input } = parseAnnouncementBody({ ...VALID_INPUT, status: 'weird' });
    expect(input?.status).toBe('draft');
  });

  it('rejects a non-object body', () => {
    const { input, errors } = parseAnnouncementBody(null);
    expect(input).toBeNull();
    expect(errors.form).toBeDefined();
  });
});
