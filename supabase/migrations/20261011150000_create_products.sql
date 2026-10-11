-- ============================================================================
-- Store products
--
-- Managed product catalogue for the public `/store` page. Rows are written only
-- by the admin endpoints (`api/admin/products.ts`) with the service role, and
-- read by the public endpoint (`api/products.ts`) and admin endpoints. The
-- browser never talks to this table directly.
--
-- Field requirements mirror the dashboard product form
-- (`src/dashboard/components/ProductForm.tsx` / `src/data/productValidation.ts`).
-- A product without a managed image is allowed; `image_url` points at a public
-- object in the `product-images` bucket.
-- ============================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- URL slug for the public detail page (`/store/<slug>`). Generated once on
  -- create and kept stable afterwards.
  slug text not null unique,
  category text not null,
  price numeric(10, 2) not null,
  -- Optional previous price. Only a genuine discount is allowed, so no
  -- misleading strikethrough price can be stored.
  compare_at_price numeric(10, 2),
  is_available boolean not null default true,
  short_description text,
  description text,
  -- Array of { label, value } pairs shown in the "معلومات إضافية" tab.
  additional_information jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  image_url text,
  is_featured boolean not null default false,
  is_best_seller boolean not null default false,
  is_new boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint products_name_check
    check (char_length(btrim(name)) between 1 and 200),
  constraint products_slug_check
    check (char_length(btrim(slug)) between 1 and 140),
  constraint products_category_check
    check (char_length(btrim(category)) between 1 and 80),
  constraint products_price_check
    check (price >= 0 and price <= 1000000),
  constraint products_compare_at_price_check
    check (compare_at_price is null or (compare_at_price >= 0 and compare_at_price > price)),
  constraint products_short_description_check
    check (short_description is null or char_length(short_description) <= 600),
  constraint products_description_check
    check (description is null or char_length(description) <= 20000),
  constraint products_additional_information_check
    check (jsonb_typeof(additional_information) = 'array'),
  constraint products_tags_check
    check (cardinality(tags) <= 20),
  constraint products_image_url_check
    check (image_url is null or char_length(image_url) <= 2048)
);

create index if not exists products_created_at_idx
  on public.products (created_at desc);

create index if not exists products_category_idx
  on public.products (category);

create index if not exists products_availability_idx
  on public.products (is_available);

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function public.products_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row
  execute function public.products_set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- Enabled with NO policies for `anon` or `authenticated`: browser clients can
-- never read or write products directly. The public store and the admin section
-- both read through serverless endpoints using the service role.
-- ----------------------------------------------------------------------------
alter table public.products enable row level security;

revoke all on public.products from anon, authenticated;
grant select, insert, update, delete on public.products to service_role;
