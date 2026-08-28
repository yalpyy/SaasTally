-- ===========================================================================
-- 0004 — One rating scale, one byline model
--
-- Two leftovers from 0003, finished together because both are data moves and
-- neither is worth a separate deploy:
--
--   1. Tool ratings join reviews on the 0–10 scale. 0003 moved review scores
--      and left tools on 5, so a reader could see 4.6 on a card and 9.2 on the
--      review page for the same product and reasonably conclude we score
--      things two different ways.
--
--      This puts both figures in the same units. It does NOT merge them into
--      one number: a tool rating is the catalogue's summary judgement and
--      exists for tools we have not reviewed — four of six today — while a
--      review score is the one the review argues for. Deriving one from the
--      other would strip the rating off most cards.
--
--   2. Article bylines move to `authors`, where review bylines already are.
--      Articles carried a free-text `author_name` alongside a `profiles`
--      reference, so the same writer could exist as a string in one place and
--      a row in another, with nothing connecting them.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. tools.rating on the 0–10 scale
--
-- numeric(2,1) tops out at 9.9, so the column widens as well as the check.
-- Existing 0–5 ratings are doubled, matching what 0003 did to review scores.
-- ---------------------------------------------------------------------------
alter table public.tools drop constraint if exists tools_rating_check;

alter table public.tools
  alter column rating type numeric(3,1);

update public.tools set rating = rating * 2 where rating is not null and rating <= 5;

alter table public.tools
  add constraint tools_rating_check
  check (rating is null or (rating >= 0 and rating <= 10));

comment on column public.tools.rating is
  'Catalogue rating out of 10, the same scale as reviews.score. Editorial, '
  'and never derived from commission.';

-- ---------------------------------------------------------------------------
-- 2. Article bylines
-- ---------------------------------------------------------------------------

-- Drop first: the updates below point author_id at an authors row, which the
-- old profiles foreign key would reject.
alter table public.articles drop constraint if exists articles_author_id_fkey;

-- Staff who are already credited on an article, mirroring 0003's review pass.
insert into public.authors (name, slug, profile_id)
select
  coalesce(p.full_name, split_part(p.email, '@', 1), 'Editorial'),
  'staff-' || replace(p.id::text, '-', ''),
  p.id
from public.profiles p
where exists (select 1 from public.articles a where a.author_id = p.id)
on conflict (slug) do nothing;

update public.articles a
set author_id = au.id
from public.authors au
where au.profile_id = a.author_id;

-- Then the free-text names. The house byline is deliberately excluded: it is
-- an organisation, not a person, and it is what a null author_id already
-- means. Turning it into an author row would invent a contributor.
insert into public.authors (name, slug)
select distinct
  trim(a.author_name),
  trim(both '-' from regexp_replace(lower(trim(a.author_name)), '[^a-z0-9]+', '-', 'g'))
from public.articles a
where a.author_id is null
  and a.author_name is not null
  and trim(a.author_name) <> ''
  and lower(trim(a.author_name)) <> 'saastally editorial'
on conflict (slug) do nothing;

update public.articles a
set author_id = au.id
from public.authors au
where a.author_id is null
  and a.author_name is not null
  and lower(trim(a.author_name)) = lower(au.name);

alter table public.articles
  add constraint articles_author_id_fkey
  foreign key (author_id) references public.authors(id) on delete set null;

-- Every name that named a person now has a row, so the column has nothing
-- left to hold that author_id does not hold better.
alter table public.articles drop column if exists author_name;
