-- ============================================================================
-- Contact requests
--
-- Stores messages submitted from the public /contact form. Rows are written
-- only by the serverless submission endpoint (`api/contact.ts`) using the
-- service role, and read/updated only by authorized admin endpoints
-- (`api/admin/contact-requests.ts`). The browser never talks to this table.
--
-- Field requirements mirror the public form
-- (src/components/contact/ContactForm.tsx): name, email and message are
-- required; phone and subject are optional. Cloudflare Turnstile is a
-- verification mechanism, not a stored field.
-- ============================================================================

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Length limits mirror the server-side validation in `api/contact.ts`.
  constraint contact_requests_name_check
    check (char_length(btrim(name)) between 1 and 120),
  constraint contact_requests_email_check
    check (
      char_length(btrim(email)) between 3 and 254
      and btrim(email) ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    ),
  constraint contact_requests_phone_check
    check (phone is null or char_length(btrim(phone)) between 1 and 32),
  constraint contact_requests_subject_check
    check (subject is null or char_length(btrim(subject)) between 1 and 200),
  constraint contact_requests_message_check
    check (char_length(btrim(message)) between 1 and 5000),

  -- Only the supported workflow states are allowed.
  constraint contact_requests_status_check
    check (status in ('new', 'in_progress', 'resolved'))
);

-- Newest-first listing and status filtering.
create index if not exists contact_requests_created_at_idx
  on public.contact_requests (created_at desc);

create index if not exists contact_requests_status_created_at_idx
  on public.contact_requests (status, created_at desc);

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function public.contact_requests_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contact_requests_set_updated_at on public.contact_requests;
create trigger contact_requests_set_updated_at
  before update on public.contact_requests
  for each row
  execute function public.contact_requests_set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- Enabled with NO policies for `anon` or `authenticated`, so browser clients
-- cannot read, insert, update or delete contact requests (default deny). The
-- serverless endpoints use the service role, which bypasses RLS: the public
-- submission endpoint inserts, and the admin endpoints read/update after
-- `requireAdmin` succeeds.
--
-- Do not add public SELECT/INSERT/UPDATE/DELETE policies for this table.
-- ----------------------------------------------------------------------------
alter table public.contact_requests enable row level security;

revoke all on public.contact_requests from anon, authenticated;
grant select, insert, update, delete on public.contact_requests to service_role;
