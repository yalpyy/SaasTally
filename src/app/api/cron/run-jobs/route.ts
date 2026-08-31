import { NextResponse, type NextRequest } from "next/server";
import { runIngestBatch } from "@/lib/ingest/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * The scheduled ingest run.
 *
 * The work itself lives in `runIngestBatch`, shared with the button in the
 * admin. All this route adds is its authorisation: there is no user here, so
 * the shared secret is the whole story, and it is checked before anything else
 * happens.
 */

const TIME_BUDGET_MS = 250_000;

function authorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;

  // No secret configured means the endpoint is closed, not open. An unset
  // variable in production must never be the thing that publishes a crawler.
  if (!secret) return false;

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const summary = await runIngestBatch(TIME_BUDGET_MS, `cron-${Date.now()}`);

  return NextResponse.json(summary, { status: summary.ok ? 200 : 503 });
}
