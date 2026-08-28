import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Admin-scoped reads for the ingest pipeline.
 *
 * Through the session client, so RLS re-checks the staff role — these tables
 * hold fetch excerpts of other people's pages and have no public policy at all.
 */

export interface AdminSourceRow {
  id: string;
  toolId: string;
  toolName: string;
  url: string;
  kind: string;
  refreshHours: number;
  active: boolean;
  lastFetchedAt: string | null;
  lastStatus: number | null;
  lastError: string | null;
  contentHash: string | null;
  nextRunAt: string;
}

interface SourceRow {
  id: string;
  tool_id: string | null;
  url: string;
  kind: string;
  refresh_hours: number;
  active: boolean;
  last_fetched_at: string | null;
  last_status: number | null;
  last_error: string | null;
  content_hash: string | null;
  next_run_at: string;
  tools: { name: string } | null;
}

const selection =
  "id, tool_id, url, kind, refresh_hours, active, last_fetched_at, last_status, last_error, content_hash, next_run_at, tools(name)";

function mapSource(row: SourceRow): AdminSourceRow {
  return {
    id: row.id,
    toolId: row.tool_id ?? "",
    toolName: row.tools?.name ?? "—",
    url: row.url,
    kind: row.kind,
    refreshHours: row.refresh_hours,
    active: row.active,
    lastFetchedAt: row.last_fetched_at,
    lastStatus: row.last_status,
    lastError: row.last_error,
    contentHash: row.content_hash,
    nextRunAt: row.next_run_at,
  };
}

export async function listSourcesForAdmin(): Promise<AdminSourceRow[] | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("content_sources")
    .select(selection)
    .order("created_at", { ascending: false });

  if (error || !data) return null;
  return (data as unknown as SourceRow[]).map(mapSource);
}

export async function getSourceForEdit(id: string): Promise<AdminSourceRow | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("content_sources")
    .select(selection)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapSource(data as unknown as SourceRow);
}

/** Queue health, for the dashboard card. Counts only — no payloads. */
export interface QueueSummary {
  pending: number;
  running: number;
  failed: number;
}

export async function getQueueSummary(): Promise<QueueSummary | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const statuses = ["pending", "running", "failed"] as const;
  const summary: QueueSummary = { pending: 0, running: 0, failed: 0 };

  for (const status of statuses) {
    const { count, error } = await supabase
      .from("ingest_jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", status);

    if (error) return null;
    summary[status] = count ?? 0;
  }

  return summary;
}
