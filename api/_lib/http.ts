import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Minimal request/response types for the Vercel Node runtime.
 *
 * The platform pre-parses JSON bodies for the `application/json` content type
 * and exposes them on `req.body`.
 */
export interface ApiRequest extends IncomingMessage {
  body?: unknown;
}

/** Send a JSON response without exposing any server internals. */
export function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload));
}

/** Standard 405 response with an Arabic message. */
export function methodNotAllowed(res: ServerResponse, allow = 'POST'): void {
  res.setHeader('Allow', allow);
  sendJson(res, 405, { message: 'الطريقة غير مسموح بها.' });
}
