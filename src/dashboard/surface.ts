/**
 * Determines whether the current request should render the admin dashboard
 * instead of the public website.
 *
 * In production the dashboard is served from its own subdomain
 * (`dashboard.associationshams.com`). During local development the same surface
 * is reachable at `/dashboard`, which does not exist as a public route.
 *
 * Keeping this as a pure function lets it be unit-tested without a DOM.
 */
export const DASHBOARD_HOST_PREFIX = 'dashboard.';

export function isDashboardSurface(
  hostname: string,
  pathname: string,
  isDev: boolean,
): boolean {
  if (hostname.toLowerCase().startsWith(DASHBOARD_HOST_PREFIX)) {
    return true;
  }

  if (isDev && (pathname === '/dashboard' || pathname.startsWith('/dashboard/'))) {
    return true;
  }

  return false;
}
