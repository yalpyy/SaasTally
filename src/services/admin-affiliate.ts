import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Admin-scoped affiliate reads.
 *
 * Reads through the **session** client, so Postgres RLS decides what comes
 * back: `affiliate_programs` is admin-read since migration 0002, and an editor
 * who somehow reached this code would get nothing rather than commercial data.
 *
 * This is the only module outside the admin UI that sees commission columns.
 * The public site resolves affiliate links through
 * `active_affiliate_link()`, which cannot return them.
 */

export interface AdminProgramRow {
  id: string;
  toolId: string;
  toolName: string;
  toolSlug: string;
  network: string | null;
  programName: string | null;
  affiliateUrl: string;
  commissionType: string | null;
  commissionValue: string | null;
  cookieDays: number | null;
  status: string;
  updatedAt: string;
}

interface ProgramRow {
  id: string;
  tool_id: string;
  network: string | null;
  program_name: string | null;
  affiliate_url: string;
  commission_type: string | null;
  commission_value: string | null;
  cookie_days: number | null;
  status: string;
  updated_at: string;
  tools: { name: string; slug: string } | null;
}

function mapProgram(row: ProgramRow): AdminProgramRow {
  return {
    id: row.id,
    toolId: row.tool_id,
    toolName: row.tools?.name ?? "Unknown tool",
    toolSlug: row.tools?.slug ?? "",
    network: row.network,
    programName: row.program_name,
    affiliateUrl: row.affiliate_url,
    commissionType: row.commission_type,
    commissionValue: row.commission_value,
    cookieDays: row.cookie_days,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

const selection =
  "id, tool_id, network, program_name, affiliate_url, commission_type, commission_value, cookie_days, status, updated_at, tools(name, slug)";

export async function listProgramsForAdmin(): Promise<AdminProgramRow[] | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("affiliate_programs")
    .select(selection)
    .order("updated_at", { ascending: false });

  if (error || !data) return null;

  return (data as unknown as ProgramRow[]).map(mapProgram);
}

export async function getProgramForEdit(id: string): Promise<AdminProgramRow | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("affiliate_programs")
    .select(selection)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return mapProgram(data as unknown as ProgramRow);
}

export interface ToolOption {
  id: string;
  name: string;
  slug: string;
}

/** Every tool, hidden ones included — a paused tool can still have a program. */
export async function listToolOptions(): Promise<ToolOption[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("tools")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error || !data) return [];

  return data as unknown as ToolOption[];
}
