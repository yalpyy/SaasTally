import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import type { ToolScreenshot } from "@/types";

/**
 * Admin-scoped tool reads.
 *
 * Separate from `src/services/tools.ts` on purpose:
 *
 *  - The public service reads through the anonymous client and only ever sees
 *    `active` rows. An editor must be able to open a hidden tool.
 *  - The editor wants **form-ready strings**, not the display-oriented `Tool`
 *    type. Doing that conversion here keeps the form component dumb.
 */
export interface EditableTool {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string;
  shortDescription: string;
  description: string;
  bestFor: string;
  companyName: string;
  startingPrice: string;
  verdict: string;
  seoTitle: string;
  seoDescription: string;
  pricingModel: string;
  rating: string;
  foundedYear: string;
  logoUrl: string | null;
  screenshots: ToolScreenshot[];
  /** Newline-separated, matching how the textareas collect them. */
  features: string;
  pros: string;
  cons: string;
  featured: boolean;
  active: boolean;
  categorySlugs: string[];
}

interface ToolEditRow {
  id: string;
  name: string;
  slug: string;
  website_url: string;
  short_description: string | null;
  description: string | null;
  best_for: string | null;
  company_name: string | null;
  starting_price: string | null;
  verdict: string | null;
  seo_title: string | null;
  seo_description: string | null;
  pricing_model: string;
  rating: number | null;
  founded_year: number | null;
  logo_url: string | null;
  screenshots: ToolScreenshot[] | null;
  features: string[] | null;
  pros: string[] | null;
  cons: string[] | null;
  featured: boolean;
  active: boolean;
  tool_categories: { categories: { slug: string } | null }[] | null;
}

const lines = (value: string[] | null): string => (value ?? []).join("\n");
const str = (value: string | null): string => value ?? "";
const num = (value: number | null): string => (value === null ? "" : String(value));

export async function getToolForEdit(id: string): Promise<EditableTool | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tools")
    .select("*, tool_categories(categories(slug))")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as ToolEditRow;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    websiteUrl: row.website_url,
    shortDescription: str(row.short_description),
    description: str(row.description),
    bestFor: str(row.best_for),
    companyName: str(row.company_name),
    startingPrice: str(row.starting_price),
    verdict: str(row.verdict),
    seoTitle: str(row.seo_title),
    seoDescription: str(row.seo_description),
    pricingModel: row.pricing_model,
    rating: num(row.rating),
    foundedYear: num(row.founded_year),
    logoUrl: row.logo_url,
    screenshots: row.screenshots ?? [],
    features: lines(row.features),
    pros: lines(row.pros),
    cons: lines(row.cons),
    featured: row.featured,
    active: row.active,
    categorySlugs: (row.tool_categories ?? [])
      .map((link) => link.categories?.slug)
      .filter((slug): slug is string => Boolean(slug)),
  };
}

/** Rows for the admin table, including hidden tools the public never sees. */
export interface AdminToolRow {
  id: string;
  name: string;
  slug: string;
  rating: number | null;
  startingPrice: string | null;
  featured: boolean;
  active: boolean;
  humanReviewed: boolean;
  categorySlugs: string[];
  updatedAt: string;
}

export async function listToolsForAdmin(): Promise<AdminToolRow[] | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tools")
    .select(
      "id, name, slug, rating, starting_price, featured, active, human_reviewed, updated_at, tool_categories(categories(slug))",
    )
    .order("updated_at", { ascending: false });

  if (error || !data) return null;

  return (
    data as unknown as {
      id: string;
      name: string;
      slug: string;
      rating: number | null;
      starting_price: string | null;
      featured: boolean;
      active: boolean;
      human_reviewed: boolean | null;
      updated_at: string;
      tool_categories: { categories: { slug: string } | null }[] | null;
    }[]
  ).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    rating: row.rating,
    startingPrice: row.starting_price,
    featured: row.featured,
    active: row.active,
    humanReviewed: row.human_reviewed ?? true,
    updatedAt: row.updated_at,
    categorySlugs: (row.tool_categories ?? [])
      .map((link) => link.categories?.slug)
      .filter((slug): slug is string => Boolean(slug)),
  }));
}