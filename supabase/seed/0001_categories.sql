-- ===========================================================================
-- Seed: categories
--
-- Run once after the migrations. Every tool needs at least one category, so
-- with this table empty the admin cannot create anything — which is the state
-- a fresh project starts in.
--
-- Safe to re-run: conflicts on slug are ignored, so this will not overwrite a
-- description you have since edited.
-- ===========================================================================

insert into public.categories (name, slug, description, icon, featured)
values
  ('AI', 'ai', 'Assistants, writing, image generation and AI infrastructure.', 'ai', true),
  ('SEO', 'seo', 'Research, rank tracking and competitive intelligence.', 'seo', true),
  ('Hosting', 'hosting', 'Shared, managed and cloud hosting for sites and apps.', 'hosting', true),
  ('E-Commerce', 'ecommerce', 'Storefronts, checkout, payments and merchandising.', 'ecommerce', true),
  ('CRM', 'crm', 'Pipelines, contact management and revenue operations.', 'crm', true),
  ('Project Management', 'project-management', 'Planning, roadmaps and team execution.', 'project-management', true),
  ('Marketing', 'marketing', 'Campaigns, content operations and lifecycle marketing.', 'marketing', true),
  ('Design', 'design', 'Interface design, brand assets and creative production.', 'design', true),
  ('VPN & Security', 'security', 'Privacy, access control and endpoint protection.', 'security', false),
  ('Developer Tools', 'developer-tools', 'Build, deploy, monitor and ship software faster.', 'developer-tools', true),
  ('Productivity', 'productivity', 'Docs, notes, wikis and everyday team workflows.', 'productivity', true),
  ('Analytics', 'analytics', 'Product, web and revenue analytics.', 'analytics', true),
  ('Automation', 'automation', 'Connect apps and remove repetitive manual work.', 'automation', false),
  ('Email Marketing', 'email-marketing', 'Newsletters, automations and deliverability.', 'email', false)
on conflict (slug) do nothing;
