import { NextResponse, type NextRequest } from "next/server";
import { claimJobs, completeJob, enqueueDueSources, failJob, ingestClient, releaseStaleJobs } from "@/lib/ingest/queue";
import { runJob } from "@/lib/ingest/handlers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * The ingest runner.
 *
 * Vercel fires this on a schedule; it drains what it can from the queue and
 * leaves the rest. That shape is deliberate: a serverless function has a hard
 * ceiling, so the run is **time-boxed** rather than sized by the backlog. A
 * hundred sources spread across several firings is fine — nothing here is
 * urgent, and a run that dies halfway through leaves its jobs claimable again
 * rather than half-applied.
 *
 * Not protected by `requireStaff`: there is no user here. The shared secret is
 * the whole authorisation story, so it is checked before anything else happens.
 */

const BATCH_SIZE = 5;
const TIME_BUDGET_MS = 250_000;

function authorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;

  // No secret configured means the endpoint is closed, not open. An unset
  // variable in production must never be the thing that publishes a crawler.
  if (!secret) return false;

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = ingestClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Ingest needs SUPABASE_SECRET_KEY and a configured project" },
      { status: 503 },
    );
  }

  const startedAt = Date.now();
  const worker = `vercel-${startedAt}`;

  // Jobs whose run died mid-flight would otherwise sit "running" forever.
  await releaseStaleJobs(supabase);

  const queued = await enqueueDueSources(supabase);

  let processed = 0;
  let failed = 0;
  const details: string[] = [];

  while (Date.now() - startedAt < TIME_BUDGET_MS) {
    const jobs = await claimJobs(supabase, worker, BATCH_SIZE);
    if (jobs.length === 0) break;

    for (const job of jobs) {
      // Re-check the budget per job: one slow vendor should not push the run
      // past the function ceiling and lose the whole batch.
      if (Date.now() - startedAt >= TIME_BUDGET_MS) {
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

  return NextResponse.json({
    queued,
    processed,
    failed,
    elapsedMs: Date.now() - startedAt,
    details: details.slice(0, 50),
  });
}
