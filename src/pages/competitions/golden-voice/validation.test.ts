import { describe, expect, it } from 'vitest';
import {
  getVideoExtensionForMime,
  getVideoMimeForExtension,
  isAcceptedVideoFile,
  isAcceptedVideoMime,
  isRegionValue,
  isValidMoroccanPhone,
  isVideoDurationValid,
  isVideoRequired,
  normalizeMoroccanPhone,
  validateRegistration,
} from './validation';
import type { RegistrationValues } from './types';

const VALID: RegistrationValues = {
  fullName: 'سعاد العلمي',
  phone: '0612345678',
  age: '22',
  city: 'بني ملال',
  region: 'beni_mellal_khenifra',
};

describe('normalizeMoroccanPhone / isValidMoroccanPhone', () => {
  it('accepts the common local and international formats', () => {
    const validNumbers = [
      '0612345678',
      '06 12 34 56 78',
      '06-12-34-56-78',
      '+212612345678',
      '+212 6 12 34 56 78',
      '00212612345678',
      '212612345678',
      '0712345678',
      '0512345678',
    ];

    for (const number of validNumbers) {
      expect(isValidMoroccanPhone(number), number).toBe(true);
    }
  });

  it('rejects malformed or incomplete numbers', () => {
    for (const number of ['061234567', '06123456789', '0012345', 'abc', '', '0912345678']) {
      expect(isValidMoroccanPhone(number), number).toBe(false);
    }
  });

  it('collapses international prefixes to a leading zero', () => {
    expect(normalizeMoroccanPhone('+212612345678')).toBe('0612345678');
    expect(normalizeMoroccanPhone('00212612345678')).toBe('0612345678');
    expect(normalizeMoroccanPhone('212612345678')).toBe('0612345678');
  });
});

describe('validateRegistration', () => {
  it('returns no errors for a complete valid submission', () => {
    expect(validateRegistration(VALID)).toEqual({});
  });

  it('requires every field', () => {
    const errors = validateRegistration({
      fullName: ' ',
      phone: '',
      age: '',
      city: '',
      region: '',
    });

    expect(errors.fullName).toBeDefined();
    expect(errors.phone).toBeDefined();
    expect(errors.age).toBeDefined();
    expect(errors.city).toBeDefined();
    expect(errors.region).toBeDefined();
  });

  it('rejects negative, zero and non-numeric ages', () => {
    expect(validateRegistration({ ...VALID, age: '-1' }).age).toBeDefined();
    expect(validateRegistration({ ...VALID, age: '0' }).age).toBeDefined();
    expect(validateRegistration({ ...VALID, age: 'abc' }).age).toBeDefined();
    expect(validateRegistration({ ...VALID, age: '1.5' }).age).toBeDefined();
    expect(validateRegistration({ ...VALID, age: '30' }).age).toBeUndefined();
  });

  it('rejects an invalid phone number', () => {
    expect(validateRegistration({ ...VALID, phone: '12345' }).phone).toBeDefined();
  });
});

describe('region helpers', () => {
  it('recognises only the approved region identifiers', () => {
    expect(isRegionValue('beni_mellal_khenifra')).toBe(true);
    expect(isRegionValue('other')).toBe(true);
    expect(isRegionValue('beni-mellal-khenifra')).toBe(false);
    expect(isRegionValue('')).toBe(false);
    expect(isRegionValue(undefined)).toBe(false);
  });

  it('requires a video only for the "other" region', () => {
    expect(isVideoRequired('other')).toBe(true);
    expect(isVideoRequired('beni_mellal_khenifra')).toBe(false);
    expect(isVideoRequired('')).toBe(false);
  });
});

describe('video helpers', () => {
  it('accepts the supported container MIME types', () => {
    for (const mime of [
      'video/mp4',
      'video/quicktime',
      'video/x-m4v',
      'video/3gpp',
      'video/3gpp2',
      'VIDEO/WEBM',
      'video/x-matroska',
      'video/x-msvideo',
    ]) {
      expect(isAcceptedVideoMime(mime), mime).toBe(true);
    }

    expect(isAcceptedVideoMime('video/mpeg')).toBe(false);
    expect(isAcceptedVideoMime('image/png')).toBe(false);
    expect(isAcceptedVideoMime('')).toBe(false);
  });

  it('falls back to the extension when the MIME type is missing', () => {
    expect(isAcceptedVideoFile('performance.mp4', '')).toBe(true);
    expect(isAcceptedVideoFile('clip.mov', '')).toBe(true);
    expect(isAcceptedVideoFile('clip.mkv', '')).toBe(true);
    expect(isAcceptedVideoFile('clip.avi', '')).toBe(true);
    expect(isAcceptedVideoFile('performance', 'video/webm')).toBe(true);
    expect(isAcceptedVideoFile('clip.avi', 'video/x-msvideo')).toBe(true);
    expect(isAcceptedVideoFile('clip.mpeg', '')).toBe(false);
    expect(isAcceptedVideoFile('image.png', 'image/png')).toBe(false);
  });

  it('maps extensions to canonical MIME types and back', () => {
    expect(getVideoMimeForExtension('MOV')).toBe('video/quicktime');
    expect(getVideoMimeForExtension('mkv')).toBe('video/x-matroska');
    expect(getVideoMimeForExtension('mpeg')).toBeNull();

    expect(getVideoExtensionForMime('video/x-msvideo')).toBe('avi');
    expect(getVideoExtensionForMime('VIDEO/3GPP')).toBe('3gp');
    expect(getVideoExtensionForMime('video/mpeg')).toBeNull();
  });

  it('accepts durations up to the 240-second server limit', () => {
    expect(isVideoDurationValid(5)).toBe(true);
    expect(isVideoDurationValid(183)).toBe(true);
    expect(isVideoDurationValid(239)).toBe(true);
    expect(isVideoDurationValid(240)).toBe(true);
    expect(isVideoDurationValid(241)).toBe(false);
    expect(isVideoDurationValid(0)).toBe(false);
    expect(isVideoDurationValid(Number.NaN)).toBe(false);
  });
});
