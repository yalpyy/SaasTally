import "server-only";

import { fetchSource } from "./fetcher";
import type { IngestJob, QueueClient } from "./queue";

/**
 * Job handlers.
 *
 * Phase 1 has exactly one: fetch a source and record what changed. The
 * extraction handlers land in phase 2 and will read from what this writes —
 * which is the reason this phase exists on its own. If the pipeline cannot
 * reliably tell "changed" from "unchanged", nothing built on top of it can be
 * trusted either, and every mistake would cost model spend to discover.
 */

export interface HandlerResult {
  ok: boolean;
  detail: string;
}

interface SourceRow {
  id: string;
  url: string;
  refresh_hours: number;
  content_hash: string | null;
  etag: string | null;
  last_modified: string | null;
}

/** Excerpt kept for debugging a bad extraction. Not content, just a sample. */
const EXCERPT_LENGTH = 2000;

function nextRun(refreshHours: number): string {
  return new Date(Date.now() + refreshHours * 3_600_000).toISOString();
}

export async function handleFetchSource(
  supabase: QueueClient,
  job: IngestJob,
): Promise<HandlerResult> {
  const sourceId = job.payload.source_id;
  if (typeof sourceId !== "string") {
    return { ok: false, detail: "Job payload has no source_id" };
  }

  const { data, error } = await supabase
    .from("content_sources")
    .select("id, url, refresh_hours, content_hash, etag, last_modified")
    .eq("id", sourceId)
    .maybeSingle();

  if (error || !data) return { ok: false, detail: "Source not found" };

  const source = data as unknown as SourceRow;

  const outcome = await fetchSource(source.url, {
    etag: source.etag,
    lastModified: source.last_modified,
    previousHash: source.content_hash,
  });

  const fetchedAt = new Date().toISOString();

  switch (outcome.kind) {
    case "changed": {
      await supabase
        .from("content_sources")
        .update({
          last_fetched_at: fetchedAt,
          last_status: outcome.status,
          last_error: null,
          etag: outcome.etag,
          last_modified: outcome.lastModified,
          content_hash: outcome.hash,
          content_excerpt: outcome.text.slice(0, EXCERPT_LENGTH),
          content_bytes: outcome.bytes,
          next_run_at: nextRun(source.refresh_hours),
        })
        .eq("id", source.id);

      // Phase 2 queues extract_facts here. Until then a change is recorded and
      // nothing acts on it — which is the point of shipping this half first.
      return { ok: true, detail: `changed (${outcome.bytes} bytes)` };
    }

    case "unchanged": {
      await supabase
        .from("content_sources")
        .update({
          last_fetched_at: fetchedAt,
          last_status: outcome.status,
          last_error: null,
          etag: outcome.etag ?? source.etag,
          last_modified: outcome.lastModified ?? source.last_modified,
          next_run_at: nextRun(source.refresh_hours),
        })
        .eq("id", source.id);

      return { ok: true, detail: "unchanged" };
    }

    case "blocked": {
      // Not a failure to retry: robots.txt will say the same thing tomorrow.
      // Deactivating the source is the honest response — we asked, and the
      // answer was no.
      await supabase
        .from("content_sources")
        .update({
          last_fetched_at: fetchedAt,
          last_status: null,
          last_error: outcome.reason,
          active: false,
        })
        .eq("id", source.id);

      return { ok: true, detail: `blocked: ${outcome.reason}` };
    }

    case "error": {
      await supabase
        .from("content_sources")
        .update({
          last_fetched_at: fetchedAt,
          last_status: outcome.status,
          last_error: outcome.reason,
        })
        .eq("id", source.id);

      return { ok: false, detail: outcome.reason };
    }
  }
}

export async function runJob(supabase: QueueClient, job: IngestJob): Promise<HandlerResult> {
  switch (job.kind) {
    case "fetch_source":
      return handleFetchSource(supabase, job);

    // Queued only from phase 2 onward; a job of this kind today means someone
    // inserted it by hand, and failing loudly beats pretending it ran.
    case "extract_facts":
    case "snapshot_price":
      return { ok: false, detail: `Handler for ${job.kind} is not implemented yet` };
  }
}
