import "server-only";

import { fetchSource } from "./fetcher";
import { extractAndApply } from "./apply";
import type { IngestJob, QueueClient } from "./queue";

/**
 * Job handlers.
 *
 * There is one: fetch a source, and when the page has changed, read facts out
 * of it before the text is discarded. Extraction runs here rather than as its
 * own queued job precisely so the vendor's page never has to be stored —
 * we hash it, extract from it, and drop it.
 */

export interface HandlerResult {
  ok: boolean;
  detail: string;
}

interface SourceRow {
  id: string;
  url: string;
  tool_id: string | null;
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
    .select("id, url, tool_id, refresh_hours, content_hash, etag, last_modified")
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

      // The text is still in memory here and nowhere else. Extraction has to
      // happen now or not at all.
      const applied = await extractAndApply(supabase, source, outcome.text);

      return { ok: true, detail: `changed (${outcome.bytes} bytes) — ${applied.detail}` };
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

    // Extraction runs inside fetch_source, so a job of either kind means
    // someone inserted it by hand. Failing loudly beats pretending it ran.
    case "extract_facts":
    case "snapshot_price":
      return { ok: false, detail: `${job.kind} is handled inside fetch_source` };
  }
}
