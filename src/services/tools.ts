import { tools as fixtureTools } from "@/data/tools";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ToolRow } from "@/lib/supabase/database.types";
import type { PricingModel, Tool, ToolFaq, ToolPricingTier } from "@/types";

/**
 * Tool reads.
 *
 * Every function here returns application types, so pages never care whether
 * the data came from Postgres or from the development fixtures.
 */

function mapToolRow(row: ToolRow, categorySlugs: string[], sponsored: boolean): Tool {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    websiteUrl: row.website_url,
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    rating: row.rating,
    startingPrice: row.starting_price,
    pricingModel: (row.pricing_model as PricingModel) ?? "custom",
    companyName: row.company_name,
    foundedYear: row.founded_year,
    featured: row.featured,
    active: row.active,
    bestFor: row.best_for,
    categorySlugs,
    features: row.features ?? [],
    pros: row.pros ?? [],
    cons: row.cons ?? [],
    pricingTiers: (row.pricing_tiers as ToolPricingTier[] | null) ?? [],
    faqs: (row.faqs as ToolFaq[] | null) ?? [],
    alternativeSlugs: [],
    verdict: row.verdict,
    sponsored,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    updatedAt: row.updated_at,
  };
}

async function liveTools(): Promise<Tool[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tools")
    .select("*, tool_categories(categories(slug)), affiliate_programs(status)")
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("name", { ascending: true });

  if (error || !data) return null;

  return (data as unknown as (ToolRow & {
    tool_categories: { categories: { slug: string } | null }[] | null;
    affiliate_programs: { status: string }[] | null;
  })[]).map((row) =>
    mapToolRow(
      row,
      (row.tool_categories ?? []).map((tc) => tc.categories?.slug).filter((s): s is string => !!s),
      (row.affiliate_programs ?? []).some((p) => p.status === "active"),
    ),
  );
}

export async function getTools(): Promise<Tool[]> {
  return (await liveTools()) ?? fixtureTools.filter((tool) => tool.active);
}

export async function getFeaturedTools(limit = 6): Promise<Tool[]> {
  const all = await getTools();
  const featured = all.filter((tool) => tool.featured);
  return (featured.length > 0 ? featured : all).slice(0, limit);
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const all = await getTools();
  return all.find((tool) => tool.slug === slug) ?? null;
}

export async function getToolsBySlugs(slugs: string[]): Promise<Tool[]> {
  const all = await getTools();
  const bySlug = new Map(all.map((tool) => [tool.slug, tool]));
  return slugs.map((slug) => bySlug.get(slug)).filter((tool): tool is Tool => Boolean(tool));
}

export async function getToolsByCategory(categorySlug: string): Promise<Tool[]> {
  const all = await getTools();
  return all.filter((tool) => tool.categorySlugs.includes(categorySlug));
}

export async function getToolSlugs(): Promise<string[]> {
  const all = await getTools();
  return all.map((tool) => tool.slug);
}
