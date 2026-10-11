-- ============================================================================
-- Members — electronic membership applications
--
-- Stores applications submitted from the public /membership form. Rows are
-- written only by the serverless submission endpoint (`api/membership.ts`)
-- using the service role, and read only by authorized admin endpoints
-- (`api/admin/members.ts`). The browser never talks to this table.
--
-- Field requirements mirror the electronic membership form
-- (src/pages/public/membership/MembershipForm.tsx and validation.ts): full
-- name, phone, city, age, gender and at least one interest are required;
-- expectations are optional. The interests list mirrors the exact approved
-- options in `src/pages/public/membership/constants.ts`.
-- ============================================================================

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  city text not null,
  age integer not null,
  -- 'male' | 'female' mirror the Gender type used by the public form.
  gender text not null,
  -- Approved interest labels; at least one is required.
  interests text[] not null,
  expectations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Length limits mirror the server-side validation in `api/membership.ts`.
  constraint members_full_name_check
    check (char_length(btrim(full_name)) between 3 and 120),
  constraint members_phone_check
    check (char_length(btrim(phone)) between 1 and 32),
  constraint members_city_check
    check (char_length(btrim(city)) between 1 and 120),
  constraint members_age_check
    check (age between 1 and 120),

  -- Only the two supported gender identifiers are allowed.
  constraint members_gender_check
    check (gender in ('male', 'female')),

  -- At least one interest, and nothing outside the approved option list.
  -- `cardinality` (not `array_length`) so an empty array fails the check.
  constraint members_interests_check
    check (
      cardinality(interests) between 1 and 5
      and interests <@ array['ثقافية', 'فنية', 'رياضية', 'ترفيهية', 'تربوية']::text[]
    ),

  -- Expectations are optional; an empty/blank value is stored as NULL.
  constraint members_expectations_check
    check (expectations is null or char_length(expectations) <= 5000)
);

-- Newest-first listing.
create index if not exists members_created_at_idx
  on public.members (created_at desc);

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function public.members_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists members_set_updated_at on public.members;
create trigger members_set_updated_at
  before update on public.members
  for each row
  execute function public.members_set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- Enabled with NO policies for `anon` or `authenticated`, so browser clients
-- cannot read, insert, update or delete members (default deny). The serverless
-- endpoints use the service role, which bypasses RLS: the public submission
-- endpoint inserts, and the admin endpoint reads after `requireAdmin`
-- succeeds.
--
-- Do not add public SELECT/INSERT/UPDATE/DELETE policies for this table.
-- ----------------------------------------------------------------------------
alter table public.members enable row level security;

revoke all on public.members from anon, authenticated;
grant select, insert, update, delete on public.members to service_role;
