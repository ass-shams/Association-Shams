import { DASHBOARD_HOST_PREFIX } from './surface';

/**
 * Resolves the URL of the public website from the current dashboard location.
 *
 * - On the dashboard subdomain (`dashboard.associationshams.com`) the public
 *   site is the same host without the `dashboard.` prefix.
 * - During local development the public site is served from the same origin, so
 *   a relative `/` is returned.
 *
 * Kept pure so it can be unit-tested without a DOM.
 */
export function resolvePublicSiteUrl(hostname: string, protocol: string): string {
  const lower = hostname.toLowerCase();

  if (lower.startsWith(DASHBOARD_HOST_PREFIX)) {
    return `${protocol}//${hostname.slice(DASHBOARD_HOST_PREFIX.length)}`;
  }

  return '/';
}
