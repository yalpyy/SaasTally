import { bestLists as fixtureBestLists } from "@/data/best-lists";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createReadSupabase } from "@/lib/supabase/server";
import type { BestList, ContentStatus } from "@/types";

/**
 * Best-list reads.
 *
 * The ordering is editorial and comes straight from `best_list_items.position`.
 * Nothing here touches `affiliate_programs` — a commission figure cannot reach
 * this code path even by accident, which is the point.
 */

interface BestListRow {
  title: string;
  slug: string;
  description: string | null;
  status: ContentStatus;
  updated_at: string;
  categories: { slug: string } | null;
  best_list_items:
    | { position: number; blurb: string | null; tools: { slug: string } | null }[]
    | null;
}

function mapBestListRow(row: BestListRow): BestList {
  const items = (row.best_list_items ?? [])
    .filter((item) => Boolean(item.tools?.slug))
    .sort((a, b) => a.position - b.position)
    .map((item) => ({ toolSlug: item.tools!.slug, blurb: item.blurb }));

  return {
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    categorySlug: row.categories?.slug ?? "",
    items,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

async function liveBestLists(): Promise<BestList[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createReadSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("best_lists")
    .select(
      "title, slug, description, status, updated_at, categories(slug), best_list_items(position, blurb, tools(slug))",
    )
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (error || !data) return null;

  return (data as unknown as BestListRow[]).map(mapBestListRow);
}

export async function getBestLists(): Promise<BestList[]> {
  const live = await liveBestLists();
  if (live) return live;

  return fixtureBestLists.filter((list) => list.status === "published");
}

export async function getBestListBySlug(slug: string): Promise<BestList | null> {
  const all = await getBestLists();
  return all.find((list) => list.slug === slug) ?? null;
}

export async function getBestListSlugs(): Promise<string[]> {
  return (await getBestLists()).map((list) => list.slug);
}
