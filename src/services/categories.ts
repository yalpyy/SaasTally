import { categories as fixtureCategories } from "@/data/categories";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabase } from "@/lib/supabase/server";
import type { CategoryRow } from "@/lib/supabase/database.types";
import type { Category } from "@/types";

function mapCategoryRow(row: CategoryRow, toolCount: number): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    icon: row.icon ?? row.slug,
    featured: row.featured,
    toolCount,
  };
}

async function liveCategories(): Promise<Category[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("categories")
    .select("*, tool_categories(count)")
    .order("name", { ascending: true });

  if (error || !data) return null;

  return (data as unknown as (CategoryRow & { tool_categories: { count: number }[] | null })[]).map(
    (row) => mapCategoryRow(row, row.tool_categories?.[0]?.count ?? 0),
  );
}

export async function getCategories(): Promise<Category[]> {
  return (await liveCategories()) ?? fixtureCategories;
}

export async function getFeaturedCategories(limit = 12): Promise<Category[]> {
  const all = await getCategories();
  const featured = all.filter((category) => category.featured);
  return (featured.length > 0 ? featured : all).slice(0, limit);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const all = await getCategories();
  return all.find((category) => category.slug === slug) ?? null;
}

export async function getCategorySlugs(): Promise<string[]> {
  const all = await getCategories();
  return all.map((category) => category.slug);
}
