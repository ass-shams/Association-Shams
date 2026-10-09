# Golden Voice → Google Sheets sync

Supabase remains the **source of truth** for registrations and private video
objects. Google Sheets is a synchronized **staff working view**. The sync runs
only on the server (serverless functions); the browser never talks to Google.

## Worksheet layout

The target tab has these columns (A–H):

| A | B | C | D | E | F | G | H |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Registration ID | Full Name | Phone | Age | City | Region | Registration Date | Video Path |

- **Registration ID** is the Supabase UUID and the stable unique key. The sync
  updates an existing row in place, so retries and reconciliation never create
  duplicate rows.
- **Region** is written as the Arabic label (e.g. `جهة بني ملال خنيفرة`).
- **Video Path** is the **private** Storage object reference
  (e.g. `golden-voice/<uuid>.mp4`) or empty for participants who do not upload.
  It is **never** a public URL.

## How it works

1. `POST /api/golden-voice/register` inserts the registration into Supabase and
   receives the new `id`/`created_at`.
2. It then performs a **best-effort** sync: read the sheet's ID column once,
   update the matching row or append a new one.
3. If the Sheets call fails, the registration still succeeds (HTTP 201). A
   failure is logged and can be repaired with the reconciliation endpoint — the
   idempotent upsert guarantees no duplicates.

## Environment variables (Vercel → Project → Settings → Environment Variables)

Server-only. Never prefix with `VITE_` and never import into client code.

| Variable | Required | Format / purpose |
| --- | --- | --- |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | yes | The ID between `/d/` and `/edit` in the sheet URL. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | recommended | The **full contents** of the downloaded service-account key JSON, as one value. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | alternative | Service-account `client_email` (used with the key below instead of the JSON). |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | alternative | The `private_key` PEM. Literal `\n` escapes are accepted and converted to newlines. |
| `GOOGLE_SHEETS_SHEET_NAME` | optional | Worksheet tab name; defaults to `Sheet1`. |
| `GOLDEN_VOICE_ADMIN_SECRET` | yes (for staff endpoints) | Long random string used as a Bearer token for the protected endpoints below. |

Use **either** `GOOGLE_SERVICE_ACCOUNT_JSON` **or** the email/private-key pair,
not both. Keep the JSON key file out of the repository (it is not committed).

## Manual setup checklist

1. Google Cloud: Sheets API enabled; service account
   `golden-voice-sheets@golden-voice-integration.iam.gserviceaccount.com`
   created.
2. Share the Google Sheet with that service-account email as **Editor**.
3. In Vercel Production, set `GOOGLE_SHEETS_SPREADSHEET_ID` and either
   `GOOGLE_SERVICE_ACCOUNT_JSON` or the email/private-key pair. Optionally set
   `GOOGLE_SHEETS_SHEET_NAME`. Set `GOLDEN_VOICE_ADMIN_SECRET`.
4. Ensure the header row exists in the tab (see the table above).

## Staff endpoints (server-to-server, protected)

Both require `Authorization: Bearer <GOLDEN_VOICE_ADMIN_SECRET>`.

### Reconcile / retry a failed sync

Re-reads every registration from Supabase and upserts it by UUID. Safe to run
repeatedly.

```bash
curl -X POST "https://<your-app>/api/golden-voice/sheets-sync" \
  -H "Authorization: Bearer $GOLDEN_VOICE_ADMIN_SECRET"
```

### Short-lived video link

Returns a temporary signed URL for a registration's private video (default 300s,
max 3600s). The sheet stores only the private path; staff request a link when
needed.

```bash
curl -X POST "https://<your-app>/api/golden-voice/video-link" \
  -H "Authorization: Bearer $GOLDEN_VOICE_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"id":"<registration-uuid>","expiresIn":300}'
# -> { "url": "https://...signed...", "expiresIn": 300 }
```

## Security notes

- Credentials and the admin secret exist only in server environment variables.
- The worksheet holds no public video URLs and no secrets.
- The public registration flow is unchanged: validation, the private bucket, the
  signed-upload model, and the 240-second server-side limit are all preserved.

## Verifying the live integration

Until credentials are configured, the sync is skipped and registrations still
succeed. To verify after configuration:

1. Submit one test registration (or run the reconcile endpoint).
2. Confirm exactly one row appears in the sheet with the correct UUID and data.
3. Run the reconcile endpoint again and confirm the row count does not change
   (idempotent, no duplicates).
4. Use the video-link endpoint with that registration's UUID and confirm the URL
   plays the private video and expires.
