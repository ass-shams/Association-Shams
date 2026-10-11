import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';

/**
 * Request/response types for the Vercel Node.js runtime.
 *
 * Vercel invokes each handler with a Node `IncomingMessage` (the `@vercel/node`
 * request extends it) augmented with the platform-parsed JSON `body`. The
 * members every handler relies on are declared explicitly so the contract is
 * unambiguous and does not depend on inference.
 */
export interface ApiRequest extends IncomingMessage {
  /** HTTP method (for example `GET`, `POST`, `PATCH`, `DELETE`). */
  method?: string;
  /** Request path including the query string. */
  url?: string;
  /** Incoming request headers. */
  headers: IncomingHttpHeaders;
  /**
   * Body parsed by the platform for `application/json` requests. The local dev
   * runner parses it the same way (see `scripts/dev-api.ts`).
   */
  body?: unknown;
}

/** Vercel Node.js response (a Node `ServerResponse`). */
export type ApiResponse = ServerResponse;

/** Options for `sendJson`. */
export interface SendJsonOptions {
  /**
   * `Cache-Control` header value. Defaults to `no-store`; public read-only
   * endpoints may opt into a short shared (CDN) cache instead.
   */
  readonly cacheControl?: string;
}

/** Send a JSON response without exposing any server internals. */
export function sendJson(
  res: ApiResponse,
  statusCode: number,
  payload: unknown,
  options: SendJsonOptions = {},
): void {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', options.cacheControl ?? 'no-store');
  res.end(JSON.stringify(payload));
}

/** Standard 405 response with an Arabic message. */
export function methodNotAllowed(res: ApiResponse, allow = 'POST'): void {
  res.setHeader('Allow', allow);
  sendJson(res, 405, { message: 'الطريقة غير مسموح بها.' });
}

/** Parse a JSON request body regardless of whether the platform pre-parsed it. */
export function readJsonBody(body: unknown): Record<string, unknown> | null {
  if (body && typeof body === 'object') {
    return body as Record<string, unknown>;
  }

  if (typeof body === 'string') {
    try {
      const parsed: unknown = JSON.parse(body);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  return null;
}
