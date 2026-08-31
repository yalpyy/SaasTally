import "server-only";

import { claimJobs, completeJob, enqueueDueSources, failJob, ingestClient, releaseStaleJobs } from "./queue";
import { runJob } from "./handlers";

/**
 * One pass over the queue.
 *
 * Shared by the scheduled route and the button in the admin, because they are
 * the same work with different authorisation: cron proves itself with a shared
 * secret, a person proves themselves by being signed in as staff. Duplicating
 * the loop for the two callers would mean fixing every future bug twice.
 *
 * Time-boxed rather than sized by the backlog: a serverless function has a
 * hard ceiling, so a run drains what it can and leaves the rest claimable.
 */

export interface RunSummary {
  ok: boolean;
  queued: number;
  processed: number;
  failed: number;
  remaining: number;
  elapsedMs: number;
  details: string[];
  error?: string;
}

const BATCH_SIZE = 5;

export async function runIngestBatch(budgetMs: number, worker: string): Promise<RunSummary> {
  const startedAt = Date.now();
  const empty = { queued: 0, processed: 0, failed: 0, remaining: 0, details: [] as string[] };

  const supabase = ingestClient();
  if (!supabase) {
    return {
      ok: false,
      ...empty,
      elapsedMs: 0,
      error: "Ingest needs SUPABASE_SECRET_KEY and a configured project",
    };
  }

  // Jobs whose run died mid-flight would otherwise sit "running" forever.
  await releaseStaleJobs(supabase);

  const queued = await enqueueDueSources(supabase);

  let processed = 0;
  let failed = 0;
  const details: string[] = [];

  while (Date.now() - startedAt < budgetMs) {
    const jobs = await claimJobs(supabase, worker, BATCH_SIZE);
    if (jobs.length === 0) break;

    for (const job of jobs) {
      // Re-check per job: one slow vendor should not push the run past the
      // function ceiling and lose the whole batch.
      if (Date.now() - startedAt >= budgetMs) {
        await failJob(supabase, job, "Run budget exhausted before this job started");
        break;
      }

      try {
        const result = await runJob(supabase, job);

        if (result.ok) {
          await completeJob(supabase, job.id);
          processed += 1;
        } else {
          await failJob(supabase, job, result.detail);
          failed += 1;
        }

        details.push(`${job.kind}: ${result.detail}`);
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Handler threw";
        await failJob(supabase, job, reason);
        failed += 1;
        details.push(`${job.kind}: ${reason}`);
      }
    }
  }

  // What is still waiting, so the caller can say whether to run again.
  const { count } = await supabase
    .from("ingest_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return {
    ok: true,
    queued,
    processed,
    failed,
    remaining: count ?? 0,
    elapsedMs: Date.now() - startedAt,
    details: details.slice(0, 50),
  };
}
