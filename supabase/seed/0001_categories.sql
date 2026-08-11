-- ===========================================================================
-- SaaSTally — category seed
-- ---------------------------------------------------------------------------
-- Categories only. This is taxonomy, not editorial judgement: the names and
-- descriptions state what a category *is*, and contain no ratings, prices,
-- rankings or product claims. Safe to publish as-is.
--
-- Deliberately NOT seeded: tools, reviews, comparisons, articles. Those must
-- come from real research. The fixtures in src/data are illustrative
-- placeholders and must never be presented to visitors as verified data.
--
-- Idempotent: safe to run more than once. Re-running updates the description
-- and icon of an existing slug rather than creating duplicates.
--
-- Run in: Supabase Dashboard → SQL Editor
-- Requires: supabase/migrations/0001_init.sql already applied
-- ===========================================================================

insert into public.categories (name, slug, description, icon, featured) values
  ('AI',                 'ai',                 'Assistants, writing, image generation and AI infrastructure.', 'ai',                 true),
  ('SEO',                'seo',                'Research, rank tracking and competitive intelligence.',       'seo',                true),
  ('Hosting',            'hosting',            'Shared, managed and cloud hosting for sites and apps.',       'hosting',            true),
  ('E-Commerce',         'ecommerce',          'Storefronts, checkout, payments and merchandising.',          'ecommerce',          true),
  ('CRM',                'crm',                'Pipelines, contact management and revenue operations.',       'crm',                true),
  ('Project Management', 'project-management', 'Planning, roadmaps and team execution.',                      'project-management', true),
  ('Marketing',          'marketing',          'Campaigns, content operations and lifecycle marketing.',      'marketing',          true),
  ('Design',             'design',             'Interface design, brand assets and creative production.',     'design',             true),
  ('Developer Tools',    'developer-tools',    'Build, deploy, monitor and ship software faster.',            'developer-tools',    true),
  ('Productivity',       'productivity',       'Docs, notes, wikis and everyday team workflows.',             'productivity',       true),
  ('Analytics',          'analytics',          'Product, web and revenue analytics.',                         'analytics',          true),
  ('VPN & Security',     'security',           'Privacy, access control and endpoint protection.',            'security',           false),
  ('Automation',         'automation',         'Connect apps and remove repetitive manual work.',             'automation',         false),
  ('Email Marketing',    'email-marketing',    'Newsletters, automations and deliverability.',                'email',              false)
on conflict (slug) do update set
  name        = excluded.name,
  description = excluded.description,
  icon        = excluded.icon,
  featured    = excluded.featured,
  updated_at  = now();

-- ---------------------------------------------------------------------------
-- Sanity check — expect 14 rows, 11 of them featured.
-- ---------------------------------------------------------------------------
select
  count(*)                            as total_categories,
  count(*) filter (where featured)    as featured_categories
from public.categories;
