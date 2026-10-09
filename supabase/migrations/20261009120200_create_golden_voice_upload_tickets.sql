-- ============================================================================
-- Golden Voice upload tickets
--
-- Short-lived, one-time tickets created by the uploads endpoint (after
-- Turnstile verification) and claimed atomically by the register endpoint.
-- They bind a registration to one server-issued object path and prevent
-- replayed upload tickets.
--
-- These rows are operational only: they contain no participant data and never
-- expose videos. Expired/abandoned rows can be pruned with the query below.
-- ============================================================================

create table if not exists public.golden_voice_upload_tickets (
  id uuid primary key default gen_random_uuid(),
  object_path text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,

  -- Only server-generated object paths are allowed.
  constraint golden_voice_upload_tickets_path_check
    check (object_path ~ '^golden-voice/[0-9a-f-]{36}\.(mp4|webm)$'),

  constraint golden_voice_upload_tickets_expiry_check
    check (expires_at > created_at)
);

create index if not exists golden_voice_upload_tickets_expires_at_idx
  on public.golden_voice_upload_tickets (expires_at);

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- No policies for `anon` or `authenticated`: the public API cannot read, insert,
-- update, or delete tickets. Only the service role (serverless endpoints) can.
-- ----------------------------------------------------------------------------
alter table public.golden_voice_upload_tickets enable row level security;

revoke all on public.golden_voice_upload_tickets from anon, authenticated;
grant select, insert, update, delete on public.golden_voice_upload_tickets to service_role;

-- Housekeeping: delete tickets that are well past their useful life. Run this
-- periodically (e.g. a scheduled Supabase cron job):
--
--   delete from public.golden_voice_upload_tickets
--   where expires_at < now() - interval '1 day';
