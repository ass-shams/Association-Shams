-- ============================================================================
-- Product images — public Storage bucket
--
-- Product images are intended to be publicly visible on the storefront, so this
-- bucket is PUBLIC. Uploads are issued as short-lived signed upload URLs by the
-- admin endpoint (`api/admin/product-image-uploads.ts`) after `requireAdmin`;
-- there is deliberately NO anonymous write policy.
--
-- No SELECT policy is needed for a public bucket (objects are served through
-- the public object URL). Do not add an anonymous INSERT/UPDATE/DELETE policy.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
