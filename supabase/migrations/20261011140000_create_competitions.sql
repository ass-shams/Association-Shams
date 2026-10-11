-- ============================================================================
-- Competitions management
--
-- Adds the `public.competitions` table that drives the public `/competitions`
-- page and the dashboard Competitions section, and links Golden Voice
-- registrations to the competition they belong to.
--
-- The existing `public.golden_voice_registrations` table is NOT recreated: a
-- nullable `competition_id` column is added and existing rows are backfilled to
-- the Golden Voice competition, so no participant data is lost.
--
-- Status values must stay in sync with `src/pages/competitions/status.ts`.
-- ============================================================================

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  -- 'open' | 'paused' | 'closed'. A passed deadline is derived at read time,
  -- never stored, so editing a deadline cannot silently reopen a competition.
  status text not null default 'open',
  -- Registration end (timestamptz). NULL means "no scheduled cutoff": the
  -- stored status alone decides, per the documented rule.
  registration_deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint competitions_status_check
    check (status in ('open', 'paused', 'closed')),
  constraint competitions_slug_check
    check (char_length(btrim(slug)) between 1 and 80),
  constraint competitions_title_check
    check (char_length(btrim(title)) between 1 and 200),
  constraint competitions_description_check
    check (char_length(btrim(description)) between 1 and 5000)
);

create index if not exists competitions_created_at_idx
  on public.competitions (created_at);

-- ----------------------------------------------------------------------------
-- Seed the existing Golden Voice competition.
--
-- Values mirror the current public content in `src/data/competitions.ts` and
-- the deadline already shown on the website. `on conflict do nothing` so a
-- later administrator edit is never overwritten by re-running the migration.
-- ----------------------------------------------------------------------------
insert into public.competitions (slug, title, description, status, registration_deadline)
values (
  'golden-voice',
  'مسابقة الصوت الذهبي للأغنية العربية والغربية',
  'بدعم من وزارة الشباب والثقافة والتواصل قطاع الثقافة تعلن الجمعية عن انطلاق عملية التسجيل للمشاركة في الدورة الثانية لمسابقة الصوت الذهبي للأغنية العربية والغربية',
  'open',
  '2026-10-23T23:59:59+01:00'
)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function public.competitions_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists competitions_set_updated_at on public.competitions;
create trigger competitions_set_updated_at
  before update on public.competitions
  for each row
  execute function public.competitions_set_updated_at();

-- ----------------------------------------------------------------------------
-- Link Golden Voice registrations to their competition (backfill).
--
-- The column is nullable for safety; every existing row is attached to the
-- Golden Voice competition. The new registration endpoint always sets it.
-- ----------------------------------------------------------------------------
alter table public.golden_voice_registrations
  add column if not exists competition_id uuid
  references public.competitions (id) on delete set null;

update public.golden_voice_registrations as r
set competition_id = c.id
from public.competitions as c
where c.slug = 'golden-voice'
  and r.competition_id is null;

create index if not exists golden_voice_registrations_competition_idx
  on public.golden_voice_registrations (competition_id, created_at desc);

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- Enabled with NO policies for `anon` or `authenticated`: browser clients can
-- never read or write the competitions table directly. The public listing is
-- served by the serverless `/api/competitions` endpoint using the service role,
-- which bypasses RLS. Admin reads/writes go through `requireAdmin` endpoints.
-- ----------------------------------------------------------------------------
alter table public.competitions enable row level security;

revoke all on public.competitions from anon, authenticated;
grant select, insert, update, delete on public.competitions to service_role;
