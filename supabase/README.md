# Supabase setup — Golden Voice registration

This folder contains the database and Storage migrations for the
`/competitions/golden-voice` registration form. The migrations are **prepared
in the repository but not applied to the live project**; apply them with the
steps below.

## 1. Apply the migrations

Migrations live in `supabase/migrations/`:

- `20261009120000_create_golden_voice_registrations.sql` — table, constraints,
  Row Level Security.
- `20261009120100_create_golden_voice_videos_bucket.sql` — private Storage
  bucket and access policy notes.
- `20261009120200_create_golden_voice_upload_tickets.sql` — **no longer used.**
  The upload-ticket mechanism was removed in favour of a simpler flow. The file
  is kept (migrations are not deleted); if you apply it, the table is simply
  unused. It can be dropped manually later:
  `drop table if exists public.golden_voice_upload_tickets;`

### Option A — Supabase CLI

```bash
supabase link --project-ref <PROJECT_REF>
supabase db push
```

### Option B — SQL Editor (Dashboard)

Open **SQL Editor**, paste the content of each migration file in order, and run
them. The files are idempotent (`create table if not exists`,
`insert ... on conflict do update`).

## 2. Storage bucket

The bucket migration creates a private bucket:

- Name: `golden-voice-videos`
- Public: `false`
- File size limit: `209715200` (200 MB)
- Allowed MIME types: `video/mp4`, `video/webm`

If you prefer the Dashboard: **Storage → New bucket**, name it
`golden-voice-videos`, keep **Public bucket** disabled, then set the file size
limit and allowed MIME types.

### Required manual change: allow the additional video formats

The application now validates and stores **MP4, MOV, M4V, 3GP, 3G2, WebM, MKV,
AVI**, but the existing bucket migration only allows `video/mp4` and
`video/webm`. **Until the bucket is updated, MOV/M4V/3GP/3G2/MKV/AVI uploads
will be rejected by Storage.** This is a manual change (migrations are not
edited automatically):

```sql
update storage.buckets
set allowed_mime_types = array[
  'video/mp4',
  'video/quicktime',
  'video/x-m4v',
  'video/3gpp',
  'video/3gpp2',
  'video/webm',
  'video/x-matroska',
  'video/x-msvideo'
]
where id = 'golden-voice-videos';
```

Or in the Dashboard: **Storage → golden-voice-videos → Settings**, add the same
MIME types to **Allowed MIME types**. The file size limit (200 MB) is unchanged
and already matches `VIDEO_MAX_BYTES`.

### Storage policies

No Storage policy is created for `anon` or `authenticated`. With RLS enabled
and no policies, public visitors cannot list, read, update, or delete objects.
The serverless endpoints use the **service role**, which bypasses RLS, to issue
short-lived signed upload URLs and to read objects for verification.

**Do not add a public policy for this bucket.** Future admin reads must use
short-lived signed URLs from an authenticated, role-checked endpoint.

## 3. Submission flow (two serverless endpoints)

Because Vercel Functions cap request bodies at 4.5 MB, videos are uploaded
directly to the private bucket. The flow is:

1. `POST /api/golden-voice/uploads` — generates a non-guessable object path
   (`golden-voice/<uuid>.<ext>`) and returns a scoped signed upload URL. For
   `beni_mellal_khenifra` it returns `videoPath: null` (no upload).
2. Browser uploads the video directly to Storage via the signed URL.
3. `POST /api/golden-voice/register` — validates the fields, checks the object
   path format, and (for the video case) streams the object to verify its
   container and duration before inserting the registration. Participants from
   Beni Mellal-Khenifra register without a video.

Uploaded videos are streamed and only their structural metadata is buffered
(ISOBMFF `moov` / EBML `Info` / AVI `avih`), so function memory stays bounded
regardless of file size. `register` sets `maxDuration = 60`.

### Video rules

- Accepted formats (by real container structure, not the filename):
  **MP4, MOV/QuickTime, M4V, 3GP, 3G2, WebM, MKV, AVI**.
- Codecs: containers are validated, not decoded. H.264/AVC, HEVC/H.265, VP8,
  VP9, MPEG-4 Part 2 and others inside a supported container are stored as-is.
  Browser *playback* is not required for registration, so a codec that a given
  browser cannot preview (e.g. HEVC) is still accepted if its container and
  duration are valid.
- **MPEG program/transport streams (`.mpeg`, `.mpg`) are not supported**: their
  duration cannot be read reliably from the container without decoding, so they
  are rejected with a clear message instead of being silently accepted.
- Duration: the website asks for a maximum of **3 minutes**; the server accepts
  up to **240 seconds (4 minutes)** and rejects anything longer. Duration is
  always read from the container metadata on the server; a browser-supplied
  value is never trusted.
- Images renamed to a video extension, malformed/truncated files, and files
  whose duration cannot be read are rejected with clear Arabic messages.
- Files that the browser cannot decode (some AVI/MKV on some devices) are still
  selectable: the client treats the duration as unknown and lets the server
  validate it.

## 4. Environment variables

Configure these in **Vercel → Project → Settings → Environment Variables**
(and in `.env.local` for local `vercel dev`):

| Variable | Scope | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | client (public) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | client (public) | Publishable/anon key for signed uploads |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Privileged inserts/uploads; never exposed |
| `SUPABASE_URL` | server only | Optional override; falls back to `VITE_SUPABASE_URL` |
| `GOLDEN_VOICE_VIDEO_BUCKET` | server only | Optional; defaults to `golden-voice-videos` |
| `GOLDEN_VOICE_MAX_VIDEO_BYTES` | server only | Optional; defaults to `209715200` |

Never place `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_*` variable or in client
code.

## 5. Request routing

`vercel.json` rewrites every non-`/api` path to `index.html` for SPA routing,
while leaving `/api/*` to the serverless functions:

```
/((?!api/).*)  ->  /index.html
```

## 6. Housekeeping

- **Orphaned objects:** a video that uploads successfully but whose registration
  never completes can leave an orphaned object. Periodically reconcile the
  bucket against `golden_voice_registrations.video_path` (future admin tooling).
- **Optional rate limiting:** the endpoints are public. Add request-rate rules
  in **Vercel → Project → Firewall** if abuse becomes a problem. No in-memory
  rate limiter is used (serverless instances do not share state).

## 7. Admin dashboard authentication

Authentication uses **Supabase Auth** (email + password). Authorization is a
server-controlled allowlist, never client-editable metadata. There is no public
sign-up.

### Migration

`20261010120000_create_admin_users.sql` creates `public.admin_users`:

- RLS enabled with **no policies** → the browser can never read or write it.
- `service_role` is the only role with grants.
- `public.is_admin()` is a `security definer` helper for future admin RLS
  policies (returns only whether the current `auth.uid()` is an admin).

Apply it like the other migrations (Supabase CLI `supabase db push`, or paste
into the SQL Editor).

### Manual steps (Supabase Dashboard)

1. **Authentication → Providers → Email**: ensure Email is enabled. Disable
   "Allow new users to sign up" (or keep sign-ups disabled) so no public
   self-registration exists.
2. **Authentication → Users**: create the administrator account manually
   (email + password). Do not invent or commit credentials.
3. Grant administrator access by inserting that user's id into the allowlist:

   ```sql
   insert into public.admin_users (user_id, email)
   values ('<AUTH_USER_UUID>', '<ADMIN_EMAIL>')
   on conflict (user_id) do nothing;
   ```

   Remove access with `delete from public.admin_users where user_id = '<UUID>';`.

### Endpoint

`GET /api/admin/me` verifies the bearer access token with
`auth.getUser` (service role) and checks `admin_users`. Responses: `200` admin
identity, `401` missing/invalid session, `403` authenticated non-admin,
`503` server credentials unavailable. Every future admin endpoint must call
`requireAdmin` from `api/_lib/adminAuth.ts`; React route guards alone are not
sufficient.

### Browser client

The dashboard uses a dedicated client (`src/dashboard/auth/supabaseAuthClient.ts`)
with `persistSession: true`. The public client in `src/lib/supabase.ts` is
unchanged (no persisted session). Both use the existing `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY`; no new environment variables are required. The
service-role key is used only server-side.

### Local development (important)

`npm run dev` runs Vite only; it does **not** execute the serverless functions
under `api/`. A request to `/api/admin/me` is served by Vite as the source module
(`Content-Type: text/javascript`, HTTP 200), so the browser cannot parse it as
JSON and login never completes.

`vercel dev` (CLI 63.1.2) cannot serve this project locally: its
static-build/dev-server handshake hangs, so the Vercel server accepts TCP but
never returns HTTP. Until that tooling issue is resolved, run the API with the
bundled dev runner, which executes the **same** handlers on Node:

```bash
# terminal 1 — API on :3000 (the Vite proxy target)
npm run dev:api

# terminal 2 — frontend on :5173
npm run dev
```

Open `http://localhost:5173/dashboard`. `vite.config.ts` proxies `/api` to
`http://localhost:3000`, so the browser talks to the API on one origin. Verify
the endpoint directly (must return `401 application/json` quickly):

```bash
curl -i --max-time 5 http://localhost:5173/api/admin/me
```

If you run the API on another port, set `API_PORT` for `dev:api` and
`API_PROXY_TARGET` in `.env.local` (a server-side, non-`VITE_` variable) to match.
`vercel dev` remains the production-parity option and can be used again once the
CLI no longer hangs.

## 8. Production — dashboard subdomain

The dashboard and the public website are the **same deployment**; the app picks
the surface at runtime from the hostname (`src/dashboard/surface.ts`): the admin
dashboard on a `dashboard.*` host, the public website everywhere else. The public
site is never rendered on the dashboard host, and the dashboard is never rendered
on `associationshams.com` / `www.associationshams.com`.

### Vercel (manual, in the dashboard UI)

- Add `dashboard.associationshams.com` as a domain on the **same** Vercel
  project that serves `associationshams.com`. Do not point the public domain at a
  different project/deployment.
- `vercel.json` (already committed) keeps the SPA rewrite, excludes `/api/*` from
  it, redirects `associationshams.com/dashboard*` to the subdomain, and adds
  `X-Robots-Tag: noindex` plus frame/content-type/referrer headers on the
  dashboard host only. (`has` rules apply when deployed; they are not evaluated
  by the locally broken `vercel dev`.)

### Environment variables (Vercel → Production)

| Variable | Scope | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | build + client | Same project as the server URL |
| `VITE_SUPABASE_ANON_KEY` | build + client | Public/publishable key for the browser |
| `SUPABASE_URL` | server only | Falls back to `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Privileged admin allowlist lookup |
| `GOLDEN_VOICE_ADMIN_SECRET` | server only | Existing staff video-link endpoint |

Never put the service-role key in a `VITE_*` variable or client code.

### Supabase Auth settings (manual)

- **Auth → URL Configuration**: set the **Site URL** and add to **Redirect
  URLs** both `https://dashboard.associationshams.com` and
  `https://associationshams.com`. Password sign-in does not redirect, but any
  email flow (invite, password reset, magic link) resolves against these.
- Keep **email sign-ups** disabled; administrator accounts are created manually
  (Section 7).
- Confirm the admin account's email and ensure its `user_id` is present in
  `public.admin_users`. A confirmed Auth user that is **not** in `admin_users`
  still receives `403` from `/api/admin/me`.
