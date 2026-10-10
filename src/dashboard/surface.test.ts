import { describe, expect, it } from 'vitest';
import { isDashboardSurface } from './surface';

describe('isDashboardSurface', () => {
  it('renders the dashboard on the dashboard subdomain', () => {
    expect(isDashboardSurface('dashboard.associationshams.com', '/', false)).toBe(true);
  });

  it('does not render the dashboard on the public host in production', () => {
    expect(isDashboardSurface('associationshams.com', '/dashboard', false)).toBe(false);
  });

  it('does not expose /dashboard on the public host in production', () => {
    expect(isDashboardSurface('www.associationshams.com', '/any', false)).toBe(false);
  });

  it('renders the dashboard at /dashboard in development', () => {
    expect(isDashboardSurface('localhost', '/dashboard', true)).toBe(true);
    expect(isDashboardSurface('localhost', '/dashboard/', true)).toBe(true);
  });

  it('keeps the public site in development outside /dashboard', () => {
    expect(isDashboardSurface('localhost', '/', true)).toBe(false);
    expect(isDashboardSurface('localhost', '/about', true)).toBe(false);
  });

  it('is case-insensitive for the hostname', () => {
    expect(isDashboardSurface('Dashboard.associationshams.com', '/', false)).toBe(true);
  });
});
