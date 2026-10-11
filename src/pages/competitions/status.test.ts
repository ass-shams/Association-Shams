import { describe, expect, it } from 'vitest';
import { isCompetitionStatus, isRegistrationOpen, resolveEffectiveStatus } from './status';

const NOW = new Date('2026-06-01T12:00:00.000Z');
const FUTURE = '2026-06-02T00:00:00.000Z';
const PAST = '2026-05-31T00:00:00.000Z';

describe('isCompetitionStatus', () => {
  it('accepts the three stored identifiers only', () => {
    expect(isCompetitionStatus('open')).toBe(true);
    expect(isCompetitionStatus('paused')).toBe(true);
    expect(isCompetitionStatus('closed')).toBe(true);
    expect(isCompetitionStatus('ended')).toBe(false);
    expect(isCompetitionStatus('')).toBe(false);
  });
});

describe('resolveEffectiveStatus', () => {
  it('is open when the stored status is open and there is no deadline', () => {
    expect(resolveEffectiveStatus('open', null, NOW)).toBe('open');
    expect(resolveEffectiveStatus('open', undefined, NOW)).toBe('open');
  });

  it('is open before the deadline', () => {
    expect(resolveEffectiveStatus('open', FUTURE, NOW)).toBe('open');
  });

  it('is ended when the stored status is open but the deadline passed', () => {
    expect(resolveEffectiveStatus('open', PAST, NOW)).toBe('ended');
  });

  it('keeps paused regardless of the deadline', () => {
    expect(resolveEffectiveStatus('paused', FUTURE, NOW)).toBe('paused');
    expect(resolveEffectiveStatus('paused', PAST, NOW)).toBe('paused');
  });

  it('keeps closed regardless of the deadline', () => {
    expect(resolveEffectiveStatus('closed', FUTURE, NOW)).toBe('closed');
  });
});

describe('isRegistrationOpen', () => {
  it('is true only for an effectively open competition', () => {
    expect(isRegistrationOpen('open', FUTURE, NOW)).toBe(true);
    expect(isRegistrationOpen('open', PAST, NOW)).toBe(false);
    expect(isRegistrationOpen('paused', FUTURE, NOW)).toBe(false);
    expect(isRegistrationOpen('closed', null, NOW)).toBe(false);
  });
});
