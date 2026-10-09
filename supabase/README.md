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
