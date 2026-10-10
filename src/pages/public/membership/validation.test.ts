import { describe, expect, it } from 'vitest';
import { isValidAge, isValidMoroccanPhone, isValidPhone, validateMembershipForm } from './validation';
import type { MembershipFormValues } from './types';

const VALID: MembershipFormValues = {
  fullName: 'سعاد العلمي',
  phone: '0612345678',
  city: 'بني ملال',
  age: '22',
  gender: 'female',
  interests: ['ثقافية', 'فنية'],
  expectations: '',
};

describe('membership phone validation', () => {
  it('accepts Moroccan local and international formats', () => {
    for (const number of [
      '0612345678',
      '06 12 34 56 78',
      '+212612345678',
      '00212612345678',
      '212612345678',
    ]) {
      expect(isValidMoroccanPhone(number), number).toBe(true);
      expect(isValidPhone(number), number).toBe(true);
    }
  });

  it('does not reject valid international formatting', () => {
    expect(isValidPhone('+33 6 12 34 56 78')).toBe(true);
    expect(isValidPhone('+1 (202) 555-0143')).toBe(true);
  });

  it('rejects malformed values', () => {
    for (const number of ['061234567', 'abc', '', '09']) {
      expect(isValidPhone(number), number).toBe(false);
    }
  });
});

describe('membership age validation', () => {
  it('accepts positive in-range ages', () => {
    expect(isValidAge('1')).toBe(true);
    expect(isValidAge('17')).toBe(true);
    expect(isValidAge('18')).toBe(true);
    expect(isValidAge('120')).toBe(true);
  });

  it('rejects nonsensical ages', () => {
    for (const age of ['0', '-5', '5.5', '200', 'abc', '']) {
      expect(isValidAge(age), age).toBe(false);
    }
  });
});

describe('validateMembershipForm', () => {
  it('returns no errors for a complete valid submission', () => {
    expect(validateMembershipForm(VALID)).toEqual({});
  });

  it('requires every mandatory field', () => {
    const errors = validateMembershipForm({
      fullName: '',
      phone: '',
      city: '',
      age: '',
      gender: '',
      interests: [],
      expectations: '',
    });

    expect(Object.keys(errors)).toEqual([
      'fullName',
      'phone',
      'city',
      'age',
      'gender',
      'interests',
    ]);
  });

  it('treats expectations as optional', () => {
    expect(validateMembershipForm({ ...VALID, expectations: '' })).toEqual({});
  });

  it('rejects a short full name and an invalid phone', () => {
    const errors = validateMembershipForm({ ...VALID, fullName: 'أب', phone: '123' });
    expect(errors.fullName).toBeDefined();
    expect(errors.phone).toBeDefined();
  });

  it('requires at least one interest', () => {
    const errors = validateMembershipForm({ ...VALID, interests: [] });
    expect(errors.interests).toBeDefined();
  });
});
