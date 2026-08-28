-- ===========================================================================
-- 0003 — Finish the Phase 1 content model
--
-- Four decisions, one migration, because they touch overlapping tables and a
-- half-applied content model is worse than either end of it:
--
--   1. `authors` becomes its own table. Bylines were pinned to `profiles`,
--      which meant every reviewer needed a Supabase Auth account and had
--      nowhere to put a bio or a photo. Author credibility is load-bearing for
--      a site that recommends software, so it gets real fields.
--   2. Review scores move to a 0–10 scale. The overall score was 0–5 while the
--      breakdown criteria were 0–10, so a page could show 4.7 next to 9.4 and
--      mean the same thing twice. Tool ratings stay on 5 — those are the star
--      figure on cards, a different thing from an editorial score.
--   3. Comparisons become two-sided and row-shaped, matching how they are read
--      and rendered: one row per attribute, a value for each side, and an
--      explicit winner including 'tie' — which the per-tool shape could not
--      express.
--   4. `best_lists` gets a table. It was fixtures only, so live mode had no
--      way to publish or reorder a list.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. authors
-- ---------------------------------------------------------------------------
create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  title text,
  bio text,
  avatar_url text,
  -- { "x": "https://...", "linkedin": "https://..." }
  links jsonb not null default '{}'::jsonb,
  -- Set when the author is also a staff member; null for outside contributors.
  profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.authors is
  'Bylines. Separate from profiles so a contributor without a login can be '
  'credited, and so an author has somewhere to keep a bio and a photo.';

alter table public.authors enable row level security;

drop policy if exists authors_public_read on public.authors;
create policy authors_public_read on public.authors for select using (true);

drop policy if exists authors_staff_write on public.authors;
create policy authors_staff_write on public.authors
  for all using (public.is_staff()) with check (public.is_staff());

-- Re-point the review byline. The old column referenced profiles; anything
-- already stored there is a staff id, so carry it across as an author row
-- before dropping the constraint.
-- The constraint has to go first: the update below points author_id at an
-- authors row, which the old profiles foreign key would reject.
alter table public.reviews drop constraint if exists reviews_author_id_fkey;

insert into public.authors (name, slug, profile_id)
select
  coalesce(p.full_name, split_part(p.email, '@', 1), 'Editorial'),
  'staff-' || replace(p.id::text, '-', ''),
  p.id
from public.profiles p
where exists (select 1 from public.reviews r where r.author_id = p.id)
on conflict (slug) do nothing;

update public.reviews r
set author_id = a.id
from public.authors a
where a.profile_id = r.author_id;

alter table public.reviews
  add constraint reviews_author_id_fkey
  foreign key (author_id) references public.authors(id) on delete set null;

-- ---------------------------------------------------------------------------
-- 2. Review scores on a 0–10 scale
--
-- numeric(2,1) tops out at 9.9, so the column has to widen as well as the
-- check. Existing 0–5 scores are doubled so a 4.7 stays a 9.4 rather than
-- silently becoming a mediocre 4.7 out of 10.
-- ---------------------------------------------------------------------------
alter table public.reviews drop constraint if exists reviews_score_check;

alter table public.reviews
  alter column score type numeric(3,1);

update public.reviews set score = score * 2 where score is not null and score <= 5;

alter table public.reviews
  add constraint reviews_score_check
  check (score is null or (score >= 0 and score <= 10));

comment on column public.reviews.score is
  'Editorial score out of 10, on the same scale as the breakdown criteria. '
  'Not to be confused with tools.rating, which is the 5-point star figure.';

-- ---------------------------------------------------------------------------
-- 3. Two-sided, row-shaped comparisons
-- ---------------------------------------------------------------------------
alter table public.comparisons
  add column if not exists tool_a_id uuid references public.tools(id) on delete cascade,
  add column if not exists tool_b_id uuid references public.tools(id) on delete cascade,
  -- [{ "label": "Backlinks", "a": "...", "b": "...", "winner": "a" | "b" | "tie" }, ...]
  add column if not exists attributes jsonb not null default '[]'::jsonb;

-- Carry over anything already stored in the per-tool shape: positions 0 and 1
-- become the two sides. Attribute values are left behind deliberately — the
-- old shape had no way to say which side a row belonged to once merged, and
-- inventing that mapping would be worse than re-entering a handful of rows.
update public.comparisons c
set tool_a_id = coalesce(c.tool_a_id, (
      select ci.tool_id from public.comparison_items ci
      where ci.comparison_id = c.id order by ci.position, ci.id limit 1
    )),
    tool_b_id = coalesce(c.tool_b_id, (
      select ci.tool_id from public.comparison_items ci
      where ci.comparison_id = c.id order by ci.position, ci.id offset 1 limit 1
    ));

drop table if exists public.comparison_items;

alter table public.comparisons
  drop constraint if exists comparisons_two_distinct_tools;

alter table public.comparisons
  add constraint comparisons_two_distinct_tools
  check (tool_a_id is null or tool_b_id is null or tool_a_id <> tool_b_id);

comment on column public.comparisons.attributes is
  'One row per attribute: { label, a, b, winner }. Row-shaped rather than '
  'per-tool so a tie is expressible and the table renders straight from it.';

-- ---------------------------------------------------------------------------
-- 4. best_lists
-- ---------------------------------------------------------------------------
create table if not exists public.best_lists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  intro text,
  status content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.best_list_items (
  id uuid primary key default gen_random_uuid(),
  best_list_id uuid not null references public.best_lists(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete cascade,
  position smallint not null default 0,
  -- Why this tool earns this spot. Editorial, and the reason the list is not
  -- just the category sorted by rating.
  blurb text,
  unique (best_list_id, tool_id)
);

create index if not exists best_list_items_list_position_idx
  on public.best_list_items (best_list_id, position);

comment on table public.best_lists is
  'Editorially ordered shortlists. Position is chosen by an editor, never by '
  'commission — affiliate_programs is not readable from this path at all.';

alter table public.best_lists      enable row level security;
alter table public.best_list_items enable row level security;

drop policy if exists best_lists_public_read on public.best_lists;
create policy best_lists_public_read on public.best_lists
  for select using (status = 'published' or public.is_staff());

drop policy if exists best_lists_staff_write on public.best_lists;
create policy best_lists_staff_write on public.best_lists
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists best_list_items_public_read on public.best_list_items;
create policy best_list_items_public_read on public.best_list_items
  for select using (
    exists (
      select 1 from public.best_lists l
      where l.id = best_list_id and (l.status = 'published' or public.is_staff())
    )
  );

drop policy if exists best_list_items_staff_write on public.best_list_items;
create policy best_list_items_staff_write on public.best_list_items
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- updated_at triggers for the new tables
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['authors', 'best_lists'] loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I; '
      'create trigger set_updated_at before update on public.%I '
      'for each row execute function public.set_updated_at();', t, t);
  end loop;
end $$;
