-- ============================================================================
-- Golden Voice registrations
--
-- Dedicated table for the /competitions/golden-voice registration form.
-- The `region` values must stay in sync with
-- `src/pages/competitions/golden-voice/constants.ts`.
-- ============================================================================

create table if not exists public.golden_voice_registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  age integer not null,
  city text not null,
  region text not null,
  video_path text,
  created_at timestamptz not null default now(),

  -- Only the two approved region identifiers are allowed.
  constraint golden_voice_registrations_region_check
    check (region in ('beni_mellal_khenifra', 'other')),

  -- Age must be a positive integer; no competition-specific age rules exist.
  constraint golden_voice_registrations_age_check
    check (age > 0),

  -- A video path is required for participants outside Beni Mellal-Khenifra
  -- and must be absent for participants from within the region.
  constraint golden_voice_registrations_video_requirement_check
    check (
      (region = 'beni_mellal_khenifra' and video_path is null)
      or (region = 'other' and video_path is not null)
    ),

  -- Reject blank strings that would otherwise be stored as whitespace.
  constraint golden_voice_registrations_full_name_not_blank
    check (btrim(full_name) <> ''),
  constraint golden_voice_registrations_phone_not_blank
    check (btrim(phone) <> ''),
  constraint golden_voice_registrations_city_not_blank
    check (btrim(city) <> '')
);

create index if not exists golden_voice_registrations_created_at_idx
  on public.golden_voice_registrations (created_at desc);

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- Public visitors must never read or modify registrations. RLS is enabled and
-- NO policies are granted to `anon` or `authenticated`, so all public access is
-- denied by default. The serverless endpoints use the service role, which
-- bypasses RLS.
-- ----------------------------------------------------------------------------
alter table public.golden_voice_registrations enable row level security;

revoke all on public.golden_voice_registrations from anon, authenticated;
grant select, insert, update, delete on public.golden_voice_registrations to service_role;

-- No SELECT/INSERT/UPDATE/DELETE policies are intentionally defined here.
-- Do not add a broad public policy: registration writes only go through the
-- server-side submission flow.
