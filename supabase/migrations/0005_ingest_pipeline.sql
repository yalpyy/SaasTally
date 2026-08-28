-- ===========================================================================
-- 0005 — Ingest pipeline (phase 1: plumbing only)
--
-- The machinery that keeps the catalogue current without turning the site into
-- generated content. Four tables, and the split between them is the whole
-- design:
--
--   content_sources    where a fact came from, and whether it has changed
--   ingest_jobs        the work queue
--   price_snapshots    observed prices over time — fact, so it applies itself
--   content_proposals  everything else — waits for a human
--
-- The rule this encodes: an observation with a URL and a timestamp can be
-- applied automatically, because we can say exactly where it came from and
-- when. A judgement cannot. Nothing in this migration writes editorial content,
-- and `content_proposals` deliberately has no path that publishes itself.
--
-- Phase 1 populates content_sources and ingest_jobs only. The other two are
-- created now so the shape is settled before anything depends on it.
-- ===========================================================================

do $$ begin
  create type ingest_job_status as enum ('pending', 'running', 'done', 'failed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type proposal_status as enum ('pending', 'approved', 'rejected', 'superseded');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- content_sources
--
-- One row per URL we watch. `content_hash` is what makes the pipeline cheap:
-- an unchanged vendor page never reaches an extraction step, so most runs cost
-- a HEAD-ish fetch and nothing else.
-- ---------------------------------------------------------------------------
create table if not exists public.content_sources (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid references public.tools(id) on delete cascade,
  url text not null,
  kind text not null default 'vendor_page'
    check (kind in ('vendor_page', 'vendor_pricing', 'affiliate_network')),

  -- Fetch bookkeeping.
  last_fetched_at timestamptz,
  last_status smallint,
  last_error text,
  etag text,
  last_modified text,

  -- Change detection. `content_hash` is over the extracted text, not the raw
  -- bytes: a page whose only change is a rotating CSRF token has not changed
  -- in any way we care about.
  content_hash text,
  content_excerpt text,
  content_bytes integer,

  -- How often this source is worth re-checking, and when it is next due.
  refresh_hours smallint not null default 168 check (refresh_hours between 1 and 8760),
  next_run_at timestamptz not null default now(),
  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (url)
);

create index if not exists content_sources_due_idx
  on public.content_sources (next_run_at)
  where active;

comment on table public.content_sources is
  'URLs the ingest pipeline watches, with the hash of what was last seen there. '
  'Every automatically applied fact traces back to a row here — that traceability '
  'is what separates an observation we can publish from a claim we cannot.';

-- ---------------------------------------------------------------------------
-- ingest_jobs
--
-- A plain queue. `locked_at` + `locked_by` matter more than they look: Vercel
-- can fire a cron while the previous run is still going, and without a claim
-- step both runs would do the same work — twice the vendor traffic, and later,
-- twice the model spend.
-- ---------------------------------------------------------------------------
create table if not exists public.ingest_jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('fetch_source', 'extract_facts', 'snapshot_price')),
  payload jsonb not null default '{}'::jsonb,

  status ingest_job_status not null default 'pending',
  attempts smallint not null default 0,
  max_attempts smallint not null default 3,

  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,

  last_error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists ingest_jobs_claimable_idx
  on public.ingest_jobs (run_after)
  where status = 'pending';

-- One live job per kind+target. Re-queueing a source that is already waiting
-- should be a no-op, not a second fetch.
create unique index if not exists ingest_jobs_unique_pending
  on public.ingest_jobs (kind, (payload ->> 'source_id'))
  where status in ('pending', 'running');

comment on table public.ingest_jobs is
  'Work queue for the ingest pipeline. Claimed with a lock so overlapping cron '
  'runs cannot process the same job twice.';

-- ---------------------------------------------------------------------------
-- price_snapshots
--
-- Observed prices, never overwritten. The history is the point: it backs the
-- price-change alerting and, later, the pricing-history feature on the roadmap.
-- ---------------------------------------------------------------------------
create table if not exists public.price_snapshots (
  id bigint generated always as identity primary key,
  tool_id uuid not null references public.tools(id) on delete cascade,
  source_id uuid references public.content_sources(id) on delete set null,

  -- The headline figure, as the vendor writes it ("$139/mo", "Free").
  starting_price text,
  currency text,
  -- [{ "name": "Pro", "price": "$139/mo", "billing": "monthly" }, ...]
  tiers jsonb not null default '[]'::jsonb,

  observed_at timestamptz not null default now(),
  content_hash text
);

create index if not exists price_snapshots_tool_observed_idx
  on public.price_snapshots (tool_id, observed_at desc);

comment on table public.price_snapshots is
  'Prices as observed, with the source and timestamp that make them checkable. '
  'Append-only: correcting a price adds a row rather than editing one.';

-- ---------------------------------------------------------------------------
-- content_proposals
--
-- Everything the pipeline suggests but must not apply. A proposal carries what
-- it wants to change, what it saw, and which model said so, and it stays
-- `pending` until a human decides. There is deliberately no auto-approve path.
-- ---------------------------------------------------------------------------
create table if not exists public.content_proposals (
  id uuid primary key default gen_random_uuid(),
  target_table text not null
    check (target_table in ('tools', 'reviews', 'comparisons', 'best_lists', 'articles')),
  target_id uuid,
  kind text not null,

  -- Proposed field values, and the current values they would replace. Storing
  -- both means the review screen can show a real diff even if the row moved on
  -- since the proposal was made.
  proposed jsonb not null default '{}'::jsonb,
  current_values jsonb not null default '{}'::jsonb,

  source_ids uuid[] not null default '{}',
  model text,
  prompt_version text,
  confidence numeric(3,2) check (confidence is null or (confidence >= 0 and confidence <= 1)),

  status proposal_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,

  created_at timestamptz not null default now()
);

create index if not exists content_proposals_pending_idx
  on public.content_proposals (created_at desc)
  where status = 'pending';

comment on table public.content_proposals is
  'Machine-suggested changes awaiting human review. Nothing here reaches a '
  'public page without someone approving it.';

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- None of this is public. The pipeline itself runs as the service role, which
-- bypasses RLS; staff read it through the admin. Anonymous visitors have no
-- policy at all, so they see nothing — including the raw page excerpts, which
-- are someone else's content that we hold only to detect change.
-- ---------------------------------------------------------------------------
alter table public.content_sources   enable row level security;
alter table public.ingest_jobs       enable row level security;
alter table public.price_snapshots   enable row level security;
alter table public.content_proposals enable row level security;

drop policy if exists content_sources_staff_read on public.content_sources;
create policy content_sources_staff_read on public.content_sources
  for select using (public.is_staff());

drop policy if exists content_sources_staff_write on public.content_sources;
create policy content_sources_staff_write on public.content_sources
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists ingest_jobs_staff_read on public.ingest_jobs;
create policy ingest_jobs_staff_read on public.ingest_jobs
  for select using (public.is_staff());

drop policy if exists price_snapshots_staff_read on public.price_snapshots;
create policy price_snapshots_staff_read on public.price_snapshots
  for select using (public.is_staff());

drop policy if exists content_proposals_staff_read on public.content_proposals;
create policy content_proposals_staff_read on public.content_proposals
  for select using (public.is_staff());

drop policy if exists content_proposals_staff_write on public.content_proposals;
create policy content_proposals_staff_write on public.content_proposals
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Claiming jobs
--
-- `for update skip locked` is the whole concurrency story: two overlapping cron
-- runs take disjoint batches instead of fighting over the same rows. Security
-- definer so the runner can call it without owning the table.
-- ---------------------------------------------------------------------------
create or replace function public.claim_ingest_jobs(worker text, batch_size int)
returns setof public.ingest_jobs
language sql
volatile
security definer
set search_path = public
as $$
  update public.ingest_jobs j
  set status = 'running',
      locked_at = now(),
      locked_by = worker,
      attempts = j.attempts + 1
  where j.id in (
    select id from public.ingest_jobs
    where status = 'pending' and run_after <= now()
    order by run_after
    limit batch_size
    for update skip locked
  )
  returning j.*;
$$;

revoke all on function public.claim_ingest_jobs(text, int) from public;

comment on function public.claim_ingest_jobs(text, int) is
  'Atomically claim a batch of due jobs. Service role only — the runner is the '
  'only caller.';

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
drop trigger if exists set_updated_at on public.content_sources;
create trigger set_updated_at before update on public.content_sources
  for each row execute function public.set_updated_at();
