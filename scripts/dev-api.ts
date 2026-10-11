/**
 * Local development API server.
 *
 * `vercel dev` (CLI 63.1.2) cannot serve this project locally: its
 * static-build/dev-server handshake hangs, so the Vercel server never responds
 * (see the report). This tiny Node server runs the **exact same** serverless
 * handlers under `api/` so `/api/*` can be exercised locally, with the Vite dev
 * server proxying `/api` to it (see `vite.config.ts`).
 *
 * It adds no authorization of its own: the handlers still call `requireAdmin`,
 * use the same Supabase clients, and remain the only place that decides access.
 * Production continues to run these handlers on Vercel Functions.
 *
 * Usage: `npm run dev:api` (defaults to port 3000, matching the Vite proxy).
 * Override with `API_PORT`.
 */
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { existsSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Load local server variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, …).
// Values are never printed.
if (existsSync('.env.local')) {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // Optional file; ignore if unreadable.
  }
}

const PORT = Number(process.env.API_PORT ?? 3000);
const API_ROOT = path.resolve(process.cwd(), 'api');

type ApiRequest = IncomingMessage & { body?: unknown };

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload));
}

/** Map an `/api/...` pathname to the handler file under `api/`. */
async function resolveHandler(pathname: string): Promise<string | null> {
  const relative = decodeURIComponent(pathname.replace(/^\/api\/?/, ''));
  if (!relative || relative.includes('\0')) {
    return null;
  }

  const segments = relative.split('/').filter(Boolean);
  const directory = path.join(API_ROOT, ...segments.slice(0, -1));

  const candidates = [
    path.join(API_ROOT, `${relative}.ts`),
    path.join(API_ROOT, relative, 'index.ts'),
  ];

  // Match Vercel's single dynamic segment routes (for example `api/admin/[route].ts`).
  try {
    const entries = await readdir(directory);
    const dynamic = entries.find((name) => /^\[[^\]]+\]\.ts$/.test(name));
    if (dynamic) {
      candidates.push(path.join(directory, dynamic));
    }
  } catch {
    // Directory is missing or unreadable; the static candidates still apply.
  }

  for (const candidate of candidates) {
    if (!candidate.startsWith(API_ROOT + path.sep)) {
      continue;
    }
    try {
      const info = await stat(candidate);
      if (info.isFile()) {
        return candidate;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

/** Read and (for JSON) parse the request body, as the Vercel runtime does. */
async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  if (chunks.length === 0) {
    return undefined;
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  const contentType = String(req.headers['content-type'] ?? '');
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  }
  return raw;
}

const server = createServer(async (req: ApiRequest, res: ServerResponse) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    if (!url.pathname.startsWith('/api/')) {
      sendJson(res, 404, { message: 'Not found' });
      return;
    }

    const file = await resolveHandler(url.pathname);
    if (!file) {
      sendJson(res, 404, { message: 'Not found' });
      return;
    }

    req.body = await readBody(req);

    const mod = (await import(pathToFileURL(file).href)) as { default?: unknown };
    if (typeof mod.default !== 'function') {
      sendJson(res, 500, { message: 'Handler is not a function' });
      return;
    }

    await (mod.default as (r: ApiRequest, s: ServerResponse) => Promise<void> | void)(req, res);
  } catch (error) {
    console.error('dev-api error:', error instanceof Error ? error.message : 'unknown');
    if (!res.headersSent) {
      sendJson(res, 500, { message: 'Internal error' });
    }
  }
});

server.listen(PORT, () => {
  console.log(`dev-api listening on http://localhost:${PORT} (handlers from ./api)`);
});
