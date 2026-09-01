import "server-only";

import { fetchSource } from "./fetcher";
import { extractAndApply } from "./apply";
import { findPricingLink } from "./metadata";
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
  kind: string;
  tool_id: string | null;
  refresh_hours: number;
  content_hash: string | null;
  etag: string | null;
  last_modified: string | null;
}

/** Excerpt kept for debugging a bad extraction. Not content, just a sample. */
const EXCERPT_LENGTH = 2000;

/** Whether this source's tool still has no logo, so the body is worth reading. */
async function toolIsMissingLogo(
  supabase: QueueClient,
  toolId: string | null,
): Promise<boolean> {
  if (!toolId) return false;

  const { data, error } = await supabase
    .from("tools")
    .select("logo_url")
    .eq("id", toolId)
    .maybeSingle();

  if (error || !data) return false;
  return !(data as unknown as { logo_url: string | null }).logo_url;
}

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
    .select("id, url, kind, tool_id, refresh_hours, content_hash, etag, last_modified")
    .eq("id", sourceId)
    .maybeSingle();

  if (error || !data) return { ok: false, detail: "Source not found" };

  const source = data as unknown as SourceRow;

  /**
   * Conditional headers are an optimisation, and they are the wrong one when
   * the tool is still missing something we can only read out of the page.
   *
   * A source fetched before logo collection existed has a stored hash and an
   * ETag, so every later run comes back "unchanged" and the page body — the
   * only place the vendor's logo is named — is never seen again. Asking for it
   * in full, once, is what lets an existing catalogue catch up; as soon as the
   * logo lands the condition stops being true and the fetch goes back to
   * costing the vendor a 304.
   */
  const needsFullRead = await toolIsMissingLogo(supabase, source.tool_id);

  const outcome = await fetchSource(source.url, {
    etag: needsFullRead ? null : source.etag,
    lastModified: needsFullRead ? null : source.last_modified,
    previousHash: needsFullRead ? null : source.content_hash,
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

      // The page is still in memory here and nowhere else. Extraction has to
      // happen now or not at all.
      const applied = await extractAndApply(supabase, source, outcome.text, outcome.html);

      const discovered = await discoverPricingSource(supabase, source, outcome.html);

      return {
        ok: true,
        detail: `changed (${outcome.bytes} bytes) — ${applied.detail}${discovered ? ", found pricing page" : ""}`,
      };
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

/**
 * Register the vendor's own pricing page as a second source.
 *
 * Saves anyone having to find and paste it: almost every SaaS site links
 * pricing from its header, and that page is where the figures this catalogue
 * cares about actually live. Only from a homepage, and only once — the unique
 * index on url makes a repeat insert a no-op rather than a duplicate.
 */
async function discoverPricingSource(
  supabase: QueueClient,
  source: SourceRow,
  html: string,
): Promise<boolean> {
  if (source.kind !== "vendor_page" || !source.tool_id) return false;

  const pricingUrl = findPricingLink(html, source.url);
  if (!pricingUrl || pricingUrl === source.url) return false;

  const { error } = await supabase.from("content_sources").insert({
    tool_id: source.tool_id,
    url: pricingUrl,
    kind: "vendor_pricing",
  });

  return !error;
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
