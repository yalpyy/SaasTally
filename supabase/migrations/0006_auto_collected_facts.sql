-- ===========================================================================
-- 0006 — Mark what was collected automatically
--
-- Phase 2 lets the pipeline fill in a tool's facts and publish the page
-- without anyone looking at it first. That is only defensible if the page says
-- so, so these three columns exist to make the claim on every page honest:
--
--   facts_collected_at   when a machine last filled this row in
--   facts_source_url     the page it read
--   human_reviewed       whether a person has since checked it
--
-- The public tool page renders a notice from these. A row nobody has reviewed
-- says it has not been reviewed; once an editor saves it, `human_reviewed`
-- flips and the notice goes away. Nothing here changes ranking or scoring —
-- an unreviewed tool is not demoted, it is labelled.
-- ===========================================================================

alter table public.tools
  add column if not exists facts_collected_at timestamptz,
  add column if not exists facts_source_url text,
  add column if not exists human_reviewed boolean not null default false;

comment on column public.tools.facts_collected_at is
  'When the ingest pipeline last wrote this row''s facts. Null means every '
  'value here was entered by a person.';

comment on column public.tools.human_reviewed is
  'True once an editor has saved the tool. Drives the "not yet reviewed" '
  'notice on the public page — a claim we make about our own work, so it has '
  'to track reality rather than intent.';

-- Everything that exists today was typed by a person, so it is reviewed.
update public.tools set human_reviewed = true where facts_collected_at is null;

-- ---------------------------------------------------------------------------
-- Extraction runs, for cost and quality visibility
--
-- Without this, "why did the bill jump" and "which prompt version produced
-- this description" are both unanswerable.
-- ---------------------------------------------------------------------------
create table if not exists public.extraction_runs (
  id bigint generated always as identity primary key,
  source_id uuid references public.content_sources(id) on delete set null,
  tool_id uuid references public.tools(id) on delete set null,

  model text not null,
  prompt_version text not null,
  input_tokens integer,
  output_tokens integer,

  ok boolean not null,
  applied boolean not null default false,
  published boolean not null default false,
  note text,

  created_at timestamptz not null default now()
);

create index if not exists extraction_runs_created_idx
  on public.extraction_runs (created_at desc);

alter table public.extraction_runs enable row level security;

drop policy if exists extraction_runs_staff_read on public.extraction_runs;
create policy extraction_runs_staff_read on public.extraction_runs
  for select using (public.is_staff());
