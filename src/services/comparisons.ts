import { comparisons as fixtureComparisons } from "@/data/comparisons";
import type { Comparison } from "@/types";

/**
 * Comparisons are editorial documents rather than derived data, so they follow
 * the same pattern as articles. Wire the Supabase read here when the
 * `comparisons` / `comparison_items` tables are populated.
 */
export async function getComparisons(): Promise<Comparison[]> {
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
