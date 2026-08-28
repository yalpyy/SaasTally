import { comparisons as fixtureComparisons } from "@/data/comparisons";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createReadSupabase } from "@/lib/supabase/server";
import type { Comparison, ComparisonAttribute, ContentStatus } from "@/types";

/**
 * Comparisons are editorial documents rather than derived data, so they follow
 * the same pattern as reviews: anonymous client, published rows only.
 *
 * Each comparison is exactly two tools and its attributes are row-shaped
 * (`{ label, a, b, winner }`), matching both the rendered table and the schema
 * since migration 0003.
 */

interface ComparisonRow {
  id: string;
  title: string;
  slug: string;
  quick_verdict: string | null;
  recommendation: string | null;
  attributes: ComparisonAttribute[] | null;
  status: ContentStatus;
  published_at: string | null;
  updated_at: string;
  tool_a: { slug: string } | null;
  tool_b: { slug: string } | null;
}

function mapComparisonRow(row: ComparisonRow): Comparison | null {
  const a = row.tool_a?.slug;
  const b = row.tool_b?.slug;

  // A comparison missing a side has nothing to compare. Dropping it beats
  // rendering half a table.
  if (!a || !b) return null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    toolSlugs: [a, b],
    quickVerdict: row.quick_verdict ?? "",
    attributes: row.attributes ?? [],
    recommendation: row.recommendation ?? "",
    status: row.status,
    publishedAt: row.published_at ?? row.updated_at,
    updatedAt: row.updated_at,
  };
}

async function liveComparisons(): Promise<Comparison[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createReadSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("comparisons")
    .select(
      "id, title, slug, quick_verdict, recommendation, attributes, status, published_at, updated_at, tool_a:tools!comparisons_tool_a_id_fkey(slug), tool_b:tools!comparisons_tool_b_id_fkey(slug)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error || !data) return null;

  return (data as unknown as ComparisonRow[])
    .map(mapComparisonRow)
    .filter((comparison): comparison is Comparison => comparison !== null);
}

export async function getComparisons(): Promise<Comparison[]> {
  const live = await liveComparisons();
  if (live) return live;

  return fixtureComparisons
    .filter((comparison) => comparison.status === "published")
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function getComparisonBySlug(slug: string): Promise<Comparison | null> {
  const all = await getComparisons();
  return all.find((comparison) => comparison.slug === slug) ?? null;
}

export async function getComparisonsForTool(toolSlug: string): Promise<Comparison[]> {
  const all = await getComparisons();
  return all.filter((comparison) => comparison.toolSlugs.includes(toolSlug));
}

export async function getComparisonSlugs(): Promise<string[]> {
  return (await getComparisons()).map((comparison) => comparison.slug);
}
