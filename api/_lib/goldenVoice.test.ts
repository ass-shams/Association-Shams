import { describe, expect, it } from 'vitest';
import { isValidVideoPath, readJsonBody } from './goldenVoice';

describe('isValidVideoPath', () => {
  const uuid = '123e4567-e89b-12d3-a456-426614174000';

  it('accepts server-generated paths', () => {
    expect(isValidVideoPath(`golden-voice/${uuid}.mp4`)).toBe(true);
    expect(isValidVideoPath(`golden-voice/${uuid}.webm`)).toBe(true);
  });

  it('rejects paths outside the managed prefix or shape', () => {
    expect(isValidVideoPath(`${uuid}.mp4`)).toBe(false);
    expect(isValidVideoPath(`golden-voice/${uuid}.avi`)).toBe(false);
    expect(isValidVideoPath(`golden-voice/${uuid}`)).toBe(false);
    expect(isValidVideoPath(`golden-voice/../${uuid}.mp4`)).toBe(false);
    expect(isValidVideoPath(`golden-voice/${uuid.toUpperCase()}.mp4`)).toBe(false);
    expect(isValidVideoPath('')).toBe(false);
  });
});

describe('readJsonBody', () => {
  it('passes through an already-parsed object', () => {
    expect(readJsonBody({ region: 'other' })).toEqual({ region: 'other' });
  });

  it('parses a raw JSON string', () => {
    expect(readJsonBody('{"region":"other"}')).toEqual({ region: 'other' });
  });

  it('returns null for unparseable bodies', () => {
    expect(readJsonBody('not json')).toBeNull();
    expect(readJsonBody(null)).toBeNull();
    expect(readJsonBody(42)).toBeNull();
  });
});
