-- ===========================================================================
-- SaaSTally — initial schema
-- ---------------------------------------------------------------------------
-- Design notes
--   * 12 tables, deliberately. Everything here is used by phase 1 or by the
--     affiliate redirect. Resist adding more until a feature needs it.
--   * Public visitors have no accounts. `profiles` holds STAFF only.
--   * RLS is on for every table. Anonymous reads are limited to published /
--     active rows; writes require a staff role.
--   * Commission data lives in `affiliate_programs`, isolated from anything
--     that could influence editorial ranking.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type staff_role as enum ('admin', 'editor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_status as enum ('draft', 'scheduled', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type affiliate_status as enum ('active', 'paused', 'pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pricing_model as enum ('free', 'freemium', 'subscription', 'one-time', 'usage-based', 'custom');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (staff only)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role staff_role not null default 'editor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Role check used by every policy below. SECURITY DEFINER so the policy can
-- read `profiles` without recursing through its own RLS.
create or replace function public.current_staff_role()
returns staff_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_featured_idx on public.categories (featured) where featured;

-- ---------------------------------------------------------------------------
-- tools
-- ---------------------------------------------------------------------------
create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  website_url text not null,
  short_description text,
  description text,
  rating numeric(2,1) check (rating is null or (rating >= 0 and rating <= 5)),
  starting_price text,
  pricing_model pricing_model not null default 'subscription',
  company_name text,
  founded_year smallint check (founded_year is null or founded_year between 1970 and 2100),
  best_for text,
  features text[] not null default '{}',
  pros text[] not null default '{}',
  cons text[] not null default '{}',
  pricing_tiers jsonb not null default '[]'::jsonb,
  faqs jsonb not null default '[]'::jsonb,
  verdict text,
  featured boolean not null default false,
  active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tools_active_idx on public.tools (active) where active;
create index if not exists tools_featured_idx on public.tools (featured) where featured;
create index if not exists tools_name_trgm_idx on public.tools using gin (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(short_description,'')));

-- self-referencing alternatives (kept simple: directional pairs)
create table if not exists public.tool_alternatives (
  tool_id uuid not null references public.tools(id) on delete cascade,
  alternative_id uuid not null references public.tools(id) on delete cascade,
  position smallint not null default 0,
  primary key (tool_id, alternative_id),
  check (tool_id <> alternative_id)
);

-- ---------------------------------------------------------------------------
-- tool_categories (many-to-many)
-- ---------------------------------------------------------------------------
create table if not exists public.tool_categories (
  tool_id uuid not null references public.tools(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (tool_id, category_id)
);

create index if not exists tool_categories_category_idx on public.tool_categories (category_id);

-- ---------------------------------------------------------------------------
-- articles
-- ---------------------------------------------------------------------------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  -- Stored as plain text with a small Markdown subset. Swapping this for MDX or
  -- a JSON document later does not require a schema change.
  content text,
  featured_image text,
  status content_status not null default 'draft',
  author_id uuid references public.profiles(id) on delete set null,
  author_name text,
  category_slug text,
  reading_minutes smallint,
  seo_title text,
  seo_description text,
  canonical_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_status_published_idx on public.articles (status, published_at desc);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools(id) on delete cascade,
  title text not null,
  slug text not null unique,
  quick_verdict text,
  score numeric(2,1) check (score is null or (score >= 0 and score <= 5)),
  -- [{ "label": "Features", "score": 9.4 }, ...]
  breakdown jsonb not null default '[]'::jsonb,
  likes text[] not null default '{}',
  improvements text[] not null default '{}',
  features_body text,
  pricing_body text,
  experience_body text,
  audience_body text,
  final_verdict text,
  author_id uuid references public.profiles(id) on delete set null,
  status content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reviews_tool_idx on public.reviews (tool_id);
create index if not exists reviews_status_idx on public.reviews (status, published_at desc);

-- ---------------------------------------------------------------------------
-- comparisons
-- ---------------------------------------------------------------------------
create table if not exists public.comparisons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  quick_verdict text,
  recommendation text,
  status content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comparison_items (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete cascade,
  position smallint not null default 0,
  -- [{ "label": "Backlinks", "value": "...", "winner": true }, ...]
  attributes jsonb not null default '[]'::jsonb,
  unique (comparison_id, tool_id)
);

create index if not exists comparison_items_comparison_idx on public.comparison_items (comparison_id);

-- ---------------------------------------------------------------------------
-- affiliate_programs
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools(id) on delete cascade,
  network text,
  program_name text,
  affiliate_url text not null,
  commission_type text check (commission_type in ('percentage', 'flat', 'hybrid')),
  commission_value text,
  cookie_days smallint,
  status affiliate_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one active program per tool.
create unique index if not exists affiliate_programs_one_active_per_tool
  on public.affiliate_programs (tool_id)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- affiliate_clicks (aggregate only — no PII)
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_clicks (
  id bigint generated always as identity primary key,
  affiliate_program_id uuid not null references public.affiliate_programs(id) on delete cascade,
  source_page text,
  source_type text,
  cta_position text,
  device_type text check (device_type in ('mobile', 'tablet', 'desktop', 'unknown')),
  country text,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_clicks_program_created_idx
  on public.affiliate_clicks (affiliate_program_id, created_at desc);

comment on table public.affiliate_clicks is
  'Aggregate click events. Deliberately stores no IP address, user agent or identifier.';

-- ---------------------------------------------------------------------------
-- media
-- ---------------------------------------------------------------------------
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  alt_text text,
  width int,
  height int,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

-- ---------------------------------------------------------------------------
-- site_settings (single row keyed by `key`)
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','categories','tools','articles','reviews','comparisons','affiliate_programs'
  ] loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I; '
      'create trigger set_updated_at before update on public.%I '
      'for each row execute function public.set_updated_at();', t, t);
  end loop;
end $$;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.profiles           enable row level security;
alter table public.categories         enable row level security;
alter table public.tools              enable row level security;
alter table public.tool_categories    enable row level security;
alter table public.tool_alternatives  enable row level security;
alter table public.articles           enable row level security;
alter table public.reviews            enable row level security;
alter table public.comparisons        enable row level security;
alter table public.comparison_items   enable row level security;
alter table public.affiliate_programs enable row level security;
alter table public.affiliate_clicks   enable row level security;
alter table public.media              enable row level security;
alter table public.site_settings      enable row level security;

-- profiles: staff read all, users update themselves, admins manage everyone.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (public.is_staff());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- categories: public read, staff write.
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select using (true);

drop policy if exists categories_staff_write on public.categories;
create policy categories_staff_write on public.categories
  for all using (public.is_staff()) with check (public.is_staff());

-- tools: public sees active rows only.
drop policy if exists tools_public_read on public.tools;
create policy tools_public_read on public.tools for select using (active or public.is_staff());

drop policy if exists tools_staff_write on public.tools;
create policy tools_staff_write on public.tools
  for all using (public.is_staff()) with check (public.is_staff());

-- join tables: public read, staff write.
drop policy if exists tool_categories_public_read on public.tool_categories;
create policy tool_categories_public_read on public.tool_categories for select using (true);

drop policy if exists tool_categories_staff_write on public.tool_categories;
create policy tool_categories_staff_write on public.tool_categories
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists tool_alternatives_public_read on public.tool_alternatives;
create policy tool_alternatives_public_read on public.tool_alternatives for select using (true);

drop policy if exists tool_alternatives_staff_write on public.tool_alternatives;
create policy tool_alternatives_staff_write on public.tool_alternatives
  for all using (public.is_staff()) with check (public.is_staff());

-- editorial content: public sees published rows only.
drop policy if exists articles_public_read on public.articles;
create policy articles_public_read on public.articles
  for select using (status = 'published' or public.is_staff());

drop policy if exists articles_staff_write on public.articles;
create policy articles_staff_write on public.articles
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews
  for select using (status = 'published' or public.is_staff());

drop policy if exists reviews_staff_write on public.reviews;
create policy reviews_staff_write on public.reviews
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists comparisons_public_read on public.comparisons;
create policy comparisons_public_read on public.comparisons
  for select using (status = 'published' or public.is_staff());

drop policy if exists comparisons_staff_write on public.comparisons;
create policy comparisons_staff_write on public.comparisons
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists comparison_items_public_read on public.comparison_items;
create policy comparison_items_public_read on public.comparison_items for select using (true);

drop policy if exists comparison_items_staff_write on public.comparison_items;
create policy comparison_items_staff_write on public.comparison_items
  for all using (public.is_staff()) with check (public.is_staff());

-- affiliate_programs: anonymous clients may read ONLY the fact that a program
-- is active (the app never selects commission columns client-side). Writes and
-- commercial terms are admin-only.
drop policy if exists affiliate_programs_public_read on public.affiliate_programs;
create policy affiliate_programs_public_read on public.affiliate_programs
  for select using (status = 'active' or public.is_admin());

drop policy if exists affiliate_programs_admin_write on public.affiliate_programs;
create policy affiliate_programs_admin_write on public.affiliate_programs
  for all using (public.is_admin()) with check (public.is_admin());

-- affiliate_clicks: never readable by the public. Inserts come from the server
-- using the service role, which bypasses RLS.
drop policy if exists affiliate_clicks_admin_read on public.affiliate_clicks;
create policy affiliate_clicks_admin_read on public.affiliate_clicks
  for select using (public.is_admin());

-- media + settings.
drop policy if exists media_public_read on public.media;
create policy media_public_read on public.media for select using (true);

drop policy if exists media_staff_write on public.media;
create policy media_staff_write on public.media
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read on public.site_settings for select using (true);

drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_write on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ===========================================================================
-- Storage buckets
-- ===========================================================================
insert into storage.buckets (id, name, public)
values
  ('tool-logos', 'tool-logos', true),
  ('tool-screenshots', 'tool-screenshots', true),
  ('article-images', 'article-images', true),
  ('authors', 'authors', true),
  ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select using (
    bucket_id in ('tool-logos', 'tool-screenshots', 'article-images', 'authors', 'site-assets')
  );

drop policy if exists storage_staff_write on storage.objects;
create policy storage_staff_write on storage.objects
  for all using (
    bucket_id in ('tool-logos', 'tool-screenshots', 'article-images', 'authors', 'site-assets')
    and public.is_staff()
  ) with check (
    bucket_id in ('tool-logos', 'tool-screenshots', 'article-images', 'authors', 'site-assets')
    and public.is_staff()
  );
