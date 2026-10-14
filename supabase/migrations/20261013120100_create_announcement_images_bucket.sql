-- ============================================================================
-- Announcement images — public Storage bucket
--
-- Announcement images are intended to be publicly visible on `/announcements`,
-- so this bucket is PUBLIC. Uploads are issued as short-lived signed upload URLs
-- by the admin endpoint (`api/admin/announcement-image-uploads.ts`) after
-- `requireAdmin`; there is deliberately NO anonymous write policy.
--
-- No SELECT policy is needed for a public bucket (objects are served through
-- the public object URL). Do not add an anonymous INSERT/UPDATE/DELETE policy.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'announcement-images',
  'announcement-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
