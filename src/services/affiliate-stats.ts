import "server-only";

import { createServiceSupabase } from "@/lib/supabase/server";

export interface ToolClickCount {
  slug: string;
  name: string;
  clicks: number;
}

export interface ClickStats {
  /** Clicks recorded in the window. */
  total: number;
  /** Highest-clicked tools in the window, descending. */
  topTools: ToolClickCount[];
  /** Window length in days, echoed back so the UI can label itself honestly. */
  windowDays: number;
}

/**
 * Aggregate affiliate click counts for the admin dashboard.
 *
 * Reads through the service-role client because `affiliate_clicks` is closed to
 * anonymous and authenticated roles by RLS — the table holds commercial data and
 * has no public read policy. Every caller must already be behind `requireStaff`.
 *
 * Returns `null` when there is no live database (mock mode, or a missing secret
 * key), so the UI can say "not available" instead of showing a fabricated zero.
 * A zero and an unknown are different things and the dashboard should not blur
 * them.
 *
 * Aggregation happens in application code rather than SQL. At phase 1 volumes
 * that is simpler and keeps the query readable; if the table grows past a few
 * hundred thousand rows, replace the body with a Postgres view or an RPC — the
 * return shape does not have to change.
 */
export async function getClickStats(windowDays = 30): Promise<ClickStats | null> {
  const supabase = createServiceSupabase();
  if (!supabase) return null;

  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabase
      .from("affiliate_clicks")
      .select("id, affiliate_programs!inner(tools!inner(name, slug))")
      .gte("created_at", since);

    if (error || !data) return null;

    const rows = data as unknown as Array<{
      affiliate_programs: { tools: { name: string; slug: string } } | null;
    }>;

    const counts = new Map<string, ToolClickCount>();

    for (const row of rows) {
      const tool = row.affiliate_programs?.tools;
      if (!tool) continue;

      const existing = counts.get(tool.slug);
      if (existing) {
        existing.clicks += 1;
      } else {
        counts.set(tool.slug, { slug: tool.slug, name: tool.name, clicks: 1 });
      }
    }

    const topTools = [...counts.values()]
      .sort((a, b) => b.clicks - a.clicks || a.name.localeCompare(b.name))
      .slice(0, 8);

    return { total: rows.length, topTools, windowDays };
  } catch {
    // Analytics must never take the dashboard down with it.
    return null;
  }
}
