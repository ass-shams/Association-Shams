import { describe, expect, it } from 'vitest';
import { resolvePublicSiteUrl } from './publicSite';

describe('resolvePublicSiteUrl', () => {
  it('strips the dashboard prefix in production', () => {
    expect(resolvePublicSiteUrl('dashboard.associationshams.com', 'https:')).toBe(
      'https://associationshams.com',
    );
  });

  it('is case-insensitive for the hostname', () => {
    expect(resolvePublicSiteUrl('Dashboard.Example.com', 'https:')).toBe(
      'https://Example.com',
    );
  });

  it('stays relative on a non-dashboard host (development)', () => {
    expect(resolvePublicSiteUrl('localhost', 'http:')).toBe('/');
    expect(resolvePublicSiteUrl('www.associationshams.com', 'https:')).toBe('/');
  });
});
