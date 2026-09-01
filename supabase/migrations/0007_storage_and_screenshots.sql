-- ---------------------------------------------------------------------------
-- 0007 — Storage buckets, and a place to put screenshots
--
-- Two things the catalogue was missing.
--
-- 1. Storage was never actually created. `tools.logo_url` existed and every
--    card read it, but nothing wrote it and there was no bucket to write to,
--    so every tool rendered a monogram tile. The ingest pipeline can now
--    collect a vendor's own logo, and it needs somewhere to put it.
--
-- 2. Screenshots. These are the one visual an editor has to supply by hand —
--    a screenshot is a claim about what the product looks like today, taken
--    by a person who opened it. Nothing here fills them in automatically.
--
-- Logos are stored rather than hot-linked. Linking straight at 40-odd vendor
-- domains means 40-odd allowed image hosts, images that vanish when a vendor
-- reorganises their assets, and a request from every reader's browser to every
-- vendor. One copy in our own bucket avoids all three.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- tools.screenshots
--
-- An ordered list of { path, url, caption }. `path` is kept alongside the URL
-- so a deletion can find the object again; the URL is what the page renders.
-- ---------------------------------------------------------------------------
alter table public.tools
  add column if not exists screenshots jsonb not null default '[]'::jsonb;

comment on column public.tools.screenshots is
  'Editor-supplied screenshots: [{ "path": "...", "url": "...", "caption": "..." }]. Never written by the ingest pipeline.';

-- Where a logo came from, so an editor can tell a collected logo from one they
-- uploaded — and so the pipeline knows not to overwrite a human''s choice.
alter table public.tools
  add column if not exists logo_source_url text;

-- ---------------------------------------------------------------------------
-- Buckets
--
-- Public read: these are catalogue images on public pages, so a signed URL
-- would buy nothing and cost the CDN. Writes are closed — see the policies.
--
-- MIME types are restricted at the bucket, not just in application code:
-- storage is reachable with any staff token, and "only images" should not
-- depend on our upload form being the only caller. SVG is deliberately absent
-- — it is a script-bearing document, and the image optimiser refuses it.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('tool-logos',       'tool-logos',       true, 2097152,  array['image/png','image/jpeg','image/webp','image/gif']),
  ('tool-screenshots', 'tool-screenshots', true, 8388608,  array['image/png','image/jpeg','image/webp']),
  ('article-images',   'article-images',   true, 8388608,  array['image/png','image/jpeg','image/webp']),
  ('authors',          'authors',          true, 2097152,  array['image/png','image/jpeg','image/webp']),
  ('site-assets',      'site-assets',      true, 8388608,  array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Object policies
--
-- `storage.objects` has RLS on by default and no policies of its own, which is
-- why an upload through a staff session fails even though the bucket exists.
-- Public read mirrors the bucket flag; writing is staff-only through the same
-- `is_staff()` the rest of the schema uses.
--
-- The ingest pipeline runs as the service role and bypasses all of this. That
-- is intended: there is no signed-in user on a scheduled run.
-- ---------------------------------------------------------------------------
drop policy if exists saastally_media_read on storage.objects;
create policy saastally_media_read on storage.objects
  for select
  using (bucket_id in ('tool-logos','tool-screenshots','article-images','authors','site-assets'));

drop policy if exists saastally_media_write on storage.objects;
create policy saastally_media_write on storage.objects
  for all
  to authenticated
  using (
    bucket_id in ('tool-logos','tool-screenshots','article-images','authors','site-assets')
    and public.is_staff()
  )
  with check (
    bucket_id in ('tool-logos','tool-screenshots','article-images','authors','site-assets')
    and public.is_staff()
  );
