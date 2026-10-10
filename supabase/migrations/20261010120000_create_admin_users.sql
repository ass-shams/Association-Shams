-- ============================================================================
-- Admin dashboard — administrator allowlist
--
-- Authentication is handled by Supabase Auth (`auth.users`). Authorization is
-- NOT derived from client-editable user metadata. Instead, administrator
-- privileges are granted only by the presence of a row in this table, which is
-- never writable from the browser.
--
-- There is intentionally no public sign-up path: an account must be created in
-- the Supabase Dashboard first, and then its `user_id` inserted here by staff
-- (Dashboard SQL editor or a future service-role admin endpoint).
-- ============================================================================

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

-- Helpful for auditing who was granted access and when.
create index if not exists admin_users_created_at_idx
  on public.admin_users (created_at desc);

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- Enabled with NO policies for `anon` or `authenticated`, so the browser can
-- never read or write the allowlist (default deny). The serverless endpoints
-- use the service role, which bypasses RLS, to resolve administrator identity.
-- ----------------------------------------------------------------------------
alter table public.admin_users enable row level security;

revoke all on public.admin_users from anon, authenticated;
grant select, insert, update, delete on public.admin_users to service_role;

-- ----------------------------------------------------------------------------
-- `public.is_admin()` — reusable authorization check for future RLS policies
--
-- SECURITY DEFINER so it can read `admin_users` despite its RLS, while only
-- ever reporting whether the *current* authenticated user (`auth.uid()`) is an
-- administrator. It never exposes the allowlist itself. Future admin-owned
-- tables can use `using (public.is_admin())` without weakening the existing
-- Golden Voice protections.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
