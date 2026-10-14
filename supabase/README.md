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

## 9. Contact requests

End-to-end flow for the public `/contact` form and the dashboard section.

### Migration

`20261011120000_create_contact_requests.sql` creates `public.contact_requests`
(name, email, phone, subject, message, status, timestamps), length/format/status
CHECK constraints, newest-first and status indexes, an `updated_at` trigger, and
**RLS enabled with no policies** (browser roles revoked; only `service_role`
granted). Apply it with the same workflow as the other migrations (Supabase CLI
`supabase db push`, or paste into the SQL Editor for the correct project).

### Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/contact` | `POST` | Public submission: validates fields, verifies Turnstile server-side, inserts with the service role. |
| `/api/admin/contact-requests` | `GET` | `requireAdmin`; newest-first list (`status`, `q`, `page`, `pageSize`) or detail (`?id=<uuid>`). |
| `/api/admin/contact-requests` | `PATCH` | `requireAdmin`; `{ id, status }` → updates the workflow status. |

Allowed statuses: `new`, `in_progress`, `resolved`.

### Environment variable

`TURNSTILE_SECRET_KEY` (server-only) — Cloudflare Turnstile secret matching
`VITE_TURNSTILE_SITE_KEY`. The submission endpoint verifies every token with
`https://challenges.cloudflare.com/turnstile/v0/siteverify` and **fails closed**
(503) if the secret is missing. Never expose it to the browser.

### Manual test

1. Open `https://associationshams.com/contact`, complete Turnstile, send a test
   message.
2. In Supabase, confirm a row exists: `select id, name, status from public.contact_requests order by created_at desc limit 1;`
3. Open `https://dashboard.associationshams.com`, sign in as an allowlisted admin.
4. Open **طلبات الاتصال** — the message appears; the overview count increases.
5. Change its status and refresh to confirm it persists.

## 10. Members

End-to-end flow for the public `/membership` electronic form and the dashboard
section.

### Migration

`20261011130000_create_members.sql` creates `public.members` (full name, phone,
city, age, gender, `interests text[]`, optional expectations, timestamps),
length/format CHECK constraints, an `interests <@` allow-list check, a
newest-first index, an `updated_at` trigger, and **RLS enabled with no policies**
(browser roles revoked; only `service_role` granted). Apply it with the same
workflow as the other migrations (Supabase CLI `supabase db push`, or paste into
the SQL Editor for the correct project).

Field requirements mirror the form
(`src/pages/public/membership/MembershipForm.tsx`): name, phone, city, age,
gender and at least one interest are required; expectations are optional. The
interest options are the exact list in
`src/pages/public/membership/constants.ts`.

### Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/membership` | `POST` | Public submission: re-validates every field server-side and inserts with the service role. |
| `/api/admin/members` | `GET` | `requireAdmin`; newest-first list (`q`, `page`, `pageSize`). Search matches full name, phone or city. |

There is no PATCH/DELETE: the section is read-only by design.

### Environment variables

No new variables. The endpoint uses `SUPABASE_URL` (falling back to
`VITE_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` server-side, exactly like
the other admin endpoints. Never expose the service-role key to the browser.

### Manual test

1. Open `https://associationshams.com/membership`, choose **الانخراط الإلكتروني**,
   complete the form and submit.
2. In Supabase, confirm a row exists:
   `select id, full_name, city from public.members order by created_at desc limit 1;`
3. Open `https://dashboard.associationshams.com`, sign in as an allowlisted admin.
4. Open **المنخرطين** — the application appears in the table; the overview
   "إجمالي المنخرطين" count increases.
5. Use the search box (name, phone or city) and open a row to see the full
   interests and expectations.

## 11. Golden Voice participants

Admin review of the existing `/competitions/golden-voice` registrations,
including secure preview/download of the private participation videos.

### Database and Storage (already existing — no new migration)

The public registration flow and its schema/bucket already exist and are
unchanged:

- `public.golden_voice_registrations` (`20261009120000_…`): `full_name`, `phone`,
  `age`, `city`, `region`, `video_path`, `created_at`. `region` is
  `beni_mellal_khenifra` or `other`.
- Private bucket `golden-voice-videos` (`20261009120100_…`), `public = false`,
  200 MB limit, **RLS with no policies** (browser roles cannot read; only the
  service role can).

Eligibility is unchanged: participants from **بني ملال خنيفرة** register without
a video; every other region must attach one. The browser uploads the real file
directly to the private bucket through a short-lived signed upload URL issued by
`/api/golden-voice/uploads`, and `/api/golden-voice/register` re-verifies the
container/duration before inserting.

### Admin endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/admin/participants` | `GET` | `requireAdmin`; newest-first list (`q`, `page`, `pageSize`) with a derived `hasVideo` flag. Search matches full name, phone or city. |
| `/api/admin/participant-video` | `GET` | `requireAdmin`; returns a short-lived signed URL for one participant's video. `?download=1` adds an attachment disposition. |

The private object path is never sent to the browser: the list returns only
`hasVideo`, and the video endpoint reads the path from the participant record by
id (re-checked against the server-generated path format), so a client cannot
request another participant's video or an arbitrary storage path. Signed URLs
are short-lived (default 300 s) and regenerated on demand if they expire.

The pre-existing `POST /api/golden-voice/video-link` (shared
`GOLDEN_VOICE_ADMIN_SECRET`) is left untouched for the staff worksheet flow.

### Environment variables

No new variables. Reuses `SUPABASE_URL` / `VITE_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` server-side. `GOLDEN_VOICE_VIDEO_BUCKET` and
`GOLDEN_VOICE_MAX_VIDEO_BYTES` remain optional overrides.

> Note: the bucket migration currently lists only `video/mp4` and `video/webm`
> in `allowed_mime_types`, while the app accepts more containers. Until the
> bucket is widened (see §2), Storage rejects the additional formats — that is a
> manual Storage change, not a code change.

### Manual test (real video)

1. Open `https://associationshams.com/competitions/golden-voice`, complete the
   form and choose a region **other** than بني ملال خنيفرة; attach a supported
   video (< 200 MB, ≤ 3–4 min) and submit. The upload percentage must reach 100%
   before the success message.
2. In Supabase, confirm the row and its object path:
   `select id, full_name, region, video_path from public.golden_voice_registrations order by created_at desc limit 1;`
3. Open `https://dashboard.associationshams.com`, sign in as an allowlisted
   admin, and open **المشاركين في المسابقة**.
4. The participant appears; click **معاينة الفيديو** to play it in the modal
   (play/pause, volume, seek, fullscreen).
5. Click **تحميل الفيديو** — the browser downloads the real stored file, not a
   placeholder.
6. A participant from بني ملال خنيفرة shows **غير مطلوب** with no preview button,
   and does not require a video.
7. Sign out (or use a non-admin account) and confirm `/api/admin/participants`
   and `/api/admin/participant-video` both return `401`/`403`.

## 12. Competitions management

The dashboard Competitions section manages the competitions shown on the public
`/competitions` page.

### Migration

`20261011140000_create_competitions.sql`:

- Creates `public.competitions` (`slug` unique, `title`, `description`,
  `status` in `open|paused|closed`, `registration_deadline timestamptz`,
  timestamps) with an `updated_at` trigger, RLS enabled and **no policies**
  (only `service_role` granted).
- Seeds the existing **مسابقة الصوت الذهبي للأغنية العربية والغربية** competition
  (`slug = 'golden-voice'`) with the current public content and deadline
  (`on conflict do nothing`, so administrator edits are never overwritten).
- Adds a nullable `competition_id` FK to `public.golden_voice_registrations` and
  **backfills every existing row** to the Golden Voice competition, plus an
  index on `(competition_id, created_at desc)`. The participants table is not
  recreated and no participant data is lost.

Apply with the usual workflow (Supabase CLI `supabase db push`, or paste into
the SQL Editor for the correct project). Until it is applied, the public
registration endpoint fails closed (`503`) because it cannot resolve the
competition.

### Status and deadline rules

- Stored `status`: `open` / `paused` / `closed`.
- Effective status (computed, never stored): a competition whose deadline has
  passed is **`ended`** even while its stored `status` is `open`, so editing a
  deadline can never silently reopen registration.
- A missing deadline means "no scheduled cutoff"; the stored status alone
  decides.
- Shared logic: `src/pages/competitions/status.ts` (used by the browser, the
  admin/public endpoints and the registration endpoint).

### Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/competitions` | `GET` | Public list: `slug`, `title`, `description`, `status`, server-computed `effectiveStatus`, `registrationDeadline`, real `participantsCount`. |
| `/api/admin/competitions` | `GET` | `requireAdmin`; competitions with real participant counts. |
| `/api/admin/competitions` | `PATCH` | `requireAdmin`; `{ id, title?, status?, registrationDeadline? }`. Deadline is validated; `null` clears it. |
| `/api/golden-voice/register` | `POST` | Public submission; now verifies the competition is open (and inside its deadline) before inserting, and stores `competition_id`. |

The browser never reads `public.competitions` directly (RLS denies it); the
public endpoint reads it server-side with the service role. No new environment
variables.

### Participant count source

Competition participant counts filter `golden_voice_registrations` by
`competition_id`, the same records the Participants section lists, so both
sections agree. Counts are never fabricated: a failed count fails the request
rather than returning zero.

### Manual test

1. Apply the migration, then open
   `https://associationshams.com/competitions` — the Golden Voice card shows the
   real participant count and status.
2. On the dashboard, open **المسابقات**: the four statistics and the competition
   row show real data.
3. Edit **الحالة** to `متوقفة مؤقتاً` (or set a past deadline) and save.
4. Open `/competitions/golden-voice`: the form is replaced by a status notice,
   and submitting via the API returns `403`.
5. Set the status back to `مفتوحة للتسجيل` with a future deadline; registration
   works again and the new participant appears in **المشاركين في المسابقة**.

## 13. Store products

Dashboard-managed product catalogue, surfaced on the public `/store` page.

### Migrations

- `20261011150000_create_products.sql` creates `public.products` (name, slug,
  category, `price numeric(10,2)`, optional `compare_at_price` that must be a
  real discount, `is_available`, short/detailed description, `additional_information`
  jsonb, `tags text[]`, `image_url`, `is_featured`/`is_best_seller`/`is_new`,
  timestamps), an `updated_at` trigger, indexes, and **RLS with no policies**
  (only `service_role` granted).
- `20261011150100_create_product_images_bucket.sql` creates the **public**
  `product-images` bucket (5 MB, JPEG/PNG/WEBP/GIF). Uploads are issued as
  short-lived signed upload URLs after `requireAdmin`; there is no anonymous
  write policy.

Apply with the usual workflow (Supabase CLI `supabase db push`, or paste into
the SQL Editor for the correct project).

> The previous placeholder catalogue in `src/data/productCatalog.ts` is no
> longer used; the storefront is now DB-driven. The store shows an empty state
> until an administrator adds products (no fake products/prices are seeded).

### Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/products` | `GET` | Public catalogue for the storefront. |
| `/api/admin/products` | `GET` | `requireAdmin`; all products (newest first). |
| `/api/admin/products` | `POST` | `requireAdmin`; create (slug generated server-side). |
| `/api/admin/products` | `PATCH` | `requireAdmin`; update `{ id, …fields }` (slug kept stable). |
| `/api/admin/products` | `DELETE` | `requireAdmin`; `?id=<uuid>`. |
| `/api/admin/product-image-uploads` | `POST` | `requireAdmin`; `{ contentType }` → signed upload URL + public URL. |

All fields are re-validated server-side (`src/data/productValidation.ts`). An
`imageUrl` is accepted only when it points at our own public `product-images`
bucket, so arbitrary/foreign URLs cannot be stored. The browser never reads
`public.products` directly.

### Environment variables

No new variables required. Optional: `PRODUCT_IMAGE_BUCKET` (server-only) to
override the bucket name. Reuses `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
(browser) and `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (server).

### Manual test

1. Apply both migrations.
2. Dashboard → **المتجر** → **إضافة منتج**: fill the name, price and category,
   optionally upload an image (preview appears), set availability, and save.
3. Open `https://associationshams.com/store` — the product appears in the
   catalogue (and in the featured/best-seller rows when flagged), with its real
   price and category; the detail page shows the description and additional
   information.
4. Set **هل المنتج متوفر؟** off and save; the product shows **غير متوفر** on the
   public page and cannot be purchased.
5. Delete a product with confirmation; it disappears from both the dashboard and
   `/store`.

## 14. Announcements

Public announcements (`/announcements`, `/announcements/<slug>`) managed from the
dashboard **الإعلانات** section.

### Migrations

- `20261013120000_create_announcements.sql` creates `public.announcements`
  (`title`, `slug` unique, `body`, `image_url`, `status` in `draft|published`,
  nullable `published_at`, timestamps), an `updated_at` trigger, indexes, and
  **RLS** that lets `anon`/`authenticated` read only published announcements whose
  `published_at` is due. Writes are denied to anonymous users; the
  `announcements_admin_write` policy reuses the `public.is_admin()` helper for
  authenticated administrators, and the service role is granted full access.
- `20261013120100_create_announcement_images_bucket.sql` creates the **public**
  `announcement-images` bucket (5 MB, JPEG/PNG/WEBP). Uploads are issued as
  short-lived signed upload URLs after `requireAdmin`; there is no anonymous
  write policy.

Apply with the usual workflow (Supabase CLI `supabase db push`, or paste into the
SQL Editor for the correct project). The announcements migration references
`public.is_admin()`, which is created by the earlier `admin_users` migration, so
apply the migrations in filename order (as usual).

> Until the migrations are applied, the public endpoint returns `503` and the
> dashboard section reports a load failure — no data is fabricated.

### Publication rules

- Stored `status`: `draft` / `published`.
- An announcement is public only when `status = 'published'` **and**
  `published_at` is not null **and** `published_at <= now()`.
- The first time an announcement is published, the API sets `published_at` to the
  submitted date (or "now" when none was provided).
- Editing an already-published announcement **preserves** its original
  `published_at`, so the publication date cannot be changed accidentally.
- Setting a **future** `published_at` schedules the announcement: it is stored as
  published but stays hidden until the date is due.
- Unpublishing (`status = 'draft'`) removes it from the public listing and
  details endpoint immediately.

### Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/announcements` | `GET` | Public list: published, due announcements (newest first, limit 100). |
| `/api/announcements?slug=<slug>` | `GET` | Public detail: one published, due announcement, else `404`. |
| `/api/admin/announcements` | `GET` | `requireAdmin`; all announcements (newest first). |
| `/api/admin/announcements` | `POST` | `requireAdmin`; create (slug generated server-side). |
| `/api/admin/announcements` | `PATCH` | `requireAdmin`; `{ id, …fields }` edits, or `{ id, status }` to publish/unpublish. |
| `/api/admin/announcements` | `DELETE` | `requireAdmin`; `?id=<uuid>`. |
| `/api/admin/announcement-image-uploads` | `POST` | `requireAdmin`; `{ contentType }` → signed upload URL + public URL. |

All fields are re-validated server-side (`src/data/announcementValidation.ts`).
An `imageUrl` is accepted only when it points at our own public
`announcement-images` bucket. The slug is generated once on create and kept
stable on edit, so public URLs never break. Replacing an image or deleting an
announcement removes the old object from Storage, but only when it is not
referenced by another announcement.

### Environment variables

No new variables required. Optional: `ANNOUNCEMENT_IMAGE_BUCKET` (server-only) to
override the bucket name. Reuses `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
(browser) and `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (server).

### Manual test

1. Apply both migrations.
2. Dashboard → **الإعلانات** → **إضافة إعلان جديد**: fill the title and body,
   upload an image (preview appears), set the publication date, then choose
   **حفظ كمسودة** or **نشر الإعلان**.
3. Open `https://associationshams.com/announcements` — published announcements
   appear as cards (newest first); drafts and future-scheduled announcements do
   **not** appear.
4. Open an announcement card — the details page (`/announcements/<slug>`) shows
   the full title, date, image and body; refreshing the URL works.
5. From the dashboard list, use **إلغاء النشر** — the announcement disappears from
   the public pages immediately; **نشر** makes it visible again.
6. Delete an announcement with confirmation; it disappears from the dashboard and
   the public pages.
7. Sign out (or use a non-admin account) and confirm `/api/admin/announcements`
   and `/api/admin/announcement-image-uploads` both return `401`/`403`.
