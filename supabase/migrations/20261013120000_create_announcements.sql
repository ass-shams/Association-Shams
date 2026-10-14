-- ============================================================================
-- Announcements
--
-- Public announcements shown on `/announcements` and `/announcements/<slug>`,
-- managed from the dashboard "الإعلانات" section. Rows are written only by the
-- admin endpoints (`api/admin/announcements.ts`) with the service role, and read
-- by the public endpoint (`api/announcements.ts`). The browser never talks to
-- this table directly for writes.
--
-- Publication model:
--   * `status` is `draft` or `published`.
--   * `published_at` is nullable. An announcement is publicly visible only when
--     `status = 'published'` AND `published_at` is not null AND `published_at`
--     is not in the future. This supports optional scheduled publication.
--   * The first time an announcement is published, `published_at` is set by the
--     API. Editing an already-published announcement preserves that date.
--
-- Field requirements mirror the dashboard form
-- (`src/dashboard/components/AnnouncementForm.tsx` /
-- `src/data/announcementValidation.ts`). `image_url` points at a public object in
-- the `announcement-images` bucket.
-- ============================================================================

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  -- URL slug for the public detail page (`/announcements/<slug>`). Generated on
  -- create and kept stable afterwards.
  slug text not null unique,
  body text not null,
  -- Public URL of the announcement image in the `announcement-images` bucket.
  image_url text not null,
  -- Workflow status. Only `published` announcements can ever be public.
  status text not null default 'draft',
  -- Publication timestamp. Null while the announcement has never been published.
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint announcements_title_check
    check (char_length(btrim(title)) between 1 and 200),
  constraint announcements_slug_check
    check (char_length(btrim(slug)) between 1 and 180),
  constraint announcements_body_check
    check (char_length(btrim(body)) between 1 and 20000),
  constraint announcements_image_url_check
    check (char_length(btrim(image_url)) between 1 and 2048),
  constraint announcements_status_check
    check (status in ('draft', 'published'))
);

-- Public listing query: published, due, newest first.
create index if not exists announcements_public_idx
  on public.announcements (status, published_at desc);

-- Slug lookups for the detail endpoint/page.
create index if not exists announcements_slug_idx
  on public.announcements (slug);

-- Dashboard listing: newest created first.
create index if not exists announcements_created_at_idx
  on public.announcements (created_at desc);

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function public.announcements_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
  before update on public.announcements
  for each row
  execute function public.announcements_set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- Anonymous/authenticated clients may READ only published announcements whose
-- publication date is due. They may never insert, update or delete. The admin
-- endpoints use the service role (which bypasses RLS) after `requireAdmin`, and
-- the `public.is_admin()` helper (from the admin_users migration) additionally
-- guards any direct authenticated write.
-- ----------------------------------------------------------------------------
alter table public.announcements enable row level security;

-- Public, read-only visibility of due published announcements.
drop policy if exists announcements_public_read on public.announcements;
create policy announcements_public_read
  on public.announcements
  for select
  to anon, authenticated
  using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
  );

-- Defense-in-depth: an authenticated administrator may manage announcements
-- directly; ordinary users are denied by the allowlist check.
drop policy if exists announcements_admin_write on public.announcements;
create policy announcements_admin_write
  on public.announcements
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.announcements from anon, authenticated;
grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;
grant select, insert, update, delete on public.announcements to service_role;
