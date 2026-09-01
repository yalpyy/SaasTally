import "server-only";

import { createServiceSupabase } from "@/lib/supabase/server";

/**
 * The ingest queue.
 *
 * Runs as the service role: the pipeline has no signed-in user, and its tables
 * are closed to everyone else. That also means every function here is only
 * reachable from the cron route, which is the only caller.
 */

export type JobKind = "fetch_source" | "extract_facts" | "snapshot_price";

export interface IngestJob {
  id: string;
  kind: JobKind;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
}

export type QueueClient = NonNullable<ReturnType<typeof createServiceSupabase>>;

export function ingestClient(): QueueClient | null {
  return createServiceSupabase();
}

/**
 * Claim a batch of due jobs.
 *
 * Goes through the `claim_ingest_jobs` function rather than a select-then-
 * update: the lock has to be taken in the same statement that finds the rows,
 * or two overlapping cron runs will both pick up the same job.
 */
export async function claimJobs(
  supabase: QueueClient,
  worker: string,
  batchSize: number,
): Promise<IngestJob[]> {
  const { data, error } = await supabase.rpc("claim_ingest_jobs", {
    worker,
    batch_size: batchSize,
  });

  if (error || !data) return [];
  return data as unknown as IngestJob[];
}

export async function completeJob(supabase: QueueClient, id: string): Promise<void> {
  await supabase
    .from("ingest_jobs")
    .update({ status: "done", finished_at: new Date().toISOString(), locked_at: null })
    .eq("id", id);
}

/**
 * Record a failure, and decide whether it is worth another go.
 *
 * Backoff is exponential from five minutes. A vendor that is down right now is
 * usually up in an hour, and retrying every minute in the meantime just makes
 * us a nuisance.
 */
export async function failJob(
  supabase: QueueClient,
  job: IngestJob,
  reason: string,
): Promise<void> {
  const exhausted = job.attempts >= job.max_attempts;

  if (exhausted) {
    await supabase
      .from("ingest_jobs")
      .update({
        status: "failed",
        last_error: reason,
        finished_at: new Date().toISOString(),
        locked_at: null,
      })
      .eq("id", job.id);
    return;
  }

  const backoffMinutes = 5 * Math.pow(2, job.attempts - 1);
  const runAfter = new Date(Date.now() + backoffMinutes * 60_000).toISOString();

  await supabase
    .from("ingest_jobs")
    .update({ status: "pending", last_error: reason, run_after: runAfter, locked_at: null })
    .eq("id", job.id);
}

/**
 * Queue a job, ignoring it if the same target is already waiting.
 *
 * The unique index on (kind, payload->>'source_id') does the deduplication, so
 * a conflict here is the expected outcome rather than an error worth raising.
 */
export async function enqueue(
  supabase: QueueClient,
  kind: JobKind,
  payload: Record<string, unknown>,
  runAfter?: Date,
): Promise<void> {
  await supabase.from("ingest_jobs").insert({
    kind,
    payload,
    run_after: (runAfter ?? new Date()).toISOString(),
  });
}

/**
 * Queue a fetch for every source that is due and not already queued.
 *
 * Called at the top of each cron run. Sources whose `next_run_at` has not
 * arrived are left alone, which is how `refresh_hours` turns into a schedule
 * without a second scheduler.
 */
export async function enqueueDueSources(supabase: QueueClient, limit = 100): Promise<number> {
  const { data, error } = await supabase
    .from("content_sources")
    .select("id")
    .eq("active", true)
    .lte("next_run_at", new Date().toISOString())
    .limit(limit);

  if (error || !data) return 0;

  const sources = data as { id: string }[];
  let queued = 0;

  for (const source of sources) {
    const { error: insertError } = await supabase
      .from("ingest_jobs")
      .insert({ kind: "fetch_source", payload: { source_id: source.id } });

    // 23505 means a job for this source is already pending or running, which
    // is exactly what the index is there to guarantee.
    if (!insertError) queued += 1;
  }

  return queued;
}

/**
 * Bring forward the sources of tools that still have no logo.
 *
 * Logo collection arrived after the catalogue was already populated, so those
 * sources are all sitting on a `next_run_at` days away and nothing would read
 * their pages again until then. This says: those specific ones, now.
 *
 * Narrow on purpose. It moves only sources whose tool is missing a logo, so
 * running it twice in a row is close to a no-op — the first pass fills the
 * logos in and the second finds nothing to move.
 */
export async function markLogolessSourcesDue(
  supabase: QueueClient,
  limit = 200,
): Promise<number> {
  const { data: tools, error } = await supabase
    .from("tools")
    .select("id")
    .is("logo_url", null)
    .limit(limit);

  if (error || !tools || tools.length === 0) return 0;

  const toolIds = (tools as { id: string }[]).map((tool) => tool.id);

  const { data: updated, error: updateError } = await supabase
    .from("content_sources")
    .update({ next_run_at: new Date().toISOString() })
    .in("tool_id", toolIds)
    .eq("active", true)
    .select("id");

  if (updateError || !updated) return 0;
  return updated.length;
}

/** Recover jobs whose run died mid-flight — a timeout, a redeploy, a crash. */
export async function releaseStaleJobs(supabase: QueueClient, olderThanMinutes = 15): Promise<void> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000).toISOString();

  await supabase
    .from("ingest_jobs")
    .update({ status: "pending", locked_at: null, locked_by: null })
    .eq("status", "running")
    .lt("locked_at", cutoff);
}
