import type { ServerResponse } from 'node:http';
import { sendJson } from '../_lib/http.js';
import type { ApiRequest } from '../_lib/http.js';

import adminAnnouncementImageUploads from './_announcement-image-uploads.js';
import adminAnnouncements from './_announcements.js';
import adminCompetitions from './_competitions.js';
import adminContactRequests from './_contact-requests.js';
import adminMe from './_me.js';
import adminMembers from './_members.js';
import adminParticipantVideo from './_participant-video.js';
import adminParticipants from './_participants.js';
import adminProductImageUploads from './_product-image-uploads.js';
import adminProducts from './_products.js';

/**
 * Single serverless entrypoint for every `/api/admin/<route>` endpoint.
 *
 * Vercel's zero-config API routing only supports single dynamic segments in
 * non-Next apps (`[route].ts`, not `[...catchAll]`), and the Hobby plan allows
 * at most 12 functions per deployment. The eight admin endpoints are therefore
 * declared as underscore-prefixed modules (ignored by function discovery) and
 * dispatched here. Authorization is unchanged: each handler still calls
 * `requireAdmin` / `resolveAdmin` itself, so this router can never widen access.
 */
type AdminHandler = (req: ApiRequest, res: ServerResponse) => Promise<void> | void;

export const config = { maxDuration: 30 };

const ROUTES: Readonly<Record<string, AdminHandler>> = {
  'announcement-image-uploads': adminAnnouncementImageUploads,
  announcements: adminAnnouncements,
  competitions: adminCompetitions,
  'contact-requests': adminContactRequests,
  me: adminMe,
  members: adminMembers,
  'participant-video': adminParticipantVideo,
  participants: adminParticipants,
  'product-image-uploads': adminProductImageUploads,
  products: adminProducts,
};

const NOT_FOUND_MESSAGE = 'غير موجود.';

function firstString(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }
  return null;
}

/**
 * Resolve the admin route segment for a request.
 *
 * Vercel exposes the captured segment as `route` on the parsed query. The local
 * dev server keeps the original URL instead, so fall back to the URL path.
 */
export function resolveAdminRoute(req: ApiRequest): string | null {
  const query = (req as ApiRequest & { query?: unknown }).query;
  if (query && typeof query === 'object') {
    const fromQuery = firstString((query as Record<string, unknown>).route);
    if (fromQuery) {
      return fromQuery;
    }
  }

  const rawUrl = typeof req.url === 'string' ? req.url : '';
  const queryIndex = rawUrl.indexOf('?');
  if (queryIndex >= 0) {
    const fromParams = new URLSearchParams(rawUrl.slice(queryIndex + 1)).get('route');
    if (fromParams) {
      return fromParams;
    }
  }

  const pathname = queryIndex >= 0 ? rawUrl.slice(0, queryIndex) : rawUrl;
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  if (last && !last.startsWith('[')) {
    return last;
  }
  return null;
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  const route = resolveAdminRoute(req);
  const target =
    route && Object.prototype.hasOwnProperty.call(ROUTES, route) ? ROUTES[route] : undefined;

  if (!target) {
    return sendJson(res, 404, { message: NOT_FOUND_MESSAGE });
  }

  return target(req, res);
}
