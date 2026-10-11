-- ============================================================================
-- Golden Voice upload tickets
--
-- One-time tickets created by the uploads endpoint (after server-side Turnstile
-- verification) and claimed atomically by the register endpoint. A ticket binds
-- a registration to one server-issued object path and prevents replayed uploads
-- and arbitrary object-path injection.
--
-- These rows are operational only: they contain no participant data and never
-- expose videos. Expired/abandoned rows can be pruned with the query below.
-- ============================================================================

create table if not exists public.golden_voice_upload_tickets (
  id uuid primary key default gen_random_uuid(),
  object_path text not null unique,
  -- Tickets are only issued for the video-required region.
  region text not null default 'other',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,

  constraint golden_voice_upload_tickets_expiry_check
    check (expires_at > created_at)
);

-- Add the region binding for environments that already created the table.
alter table public.golden_voice_upload_tickets
  add column if not exists region text not null default 'other';

-- Only server-generated object paths are allowed. The extension set mirrors the
-- supported video formats in `src/pages/competitions/golden-voice/constants.ts`.
alter table public.golden_voice_upload_tickets
  drop constraint if exists golden_voice_upload_tickets_path_check;
alter table public.golden_voice_upload_tickets
  add constraint golden_voice_upload_tickets_path_check
    check (object_path ~ '^golden-voice/[0-9a-f-]{36}\.(mp4|mov|m4v|3gp|3g2|webm|mkv|avi)$');

alter table public.golden_voice_upload_tickets
  drop constraint if exists golden_voice_upload_tickets_region_check;
alter table public.golden_voice_upload_tickets
  add constraint golden_voice_upload_tickets_region_check check (region = 'other');

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
