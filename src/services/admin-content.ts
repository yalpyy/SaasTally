import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Admin-scoped content reads.
 *
 * Separate from the public services for the same reason `admin-tools` is: the
 * public ones read anonymously and only ever see `published` rows, while an
 * editor has to be able to open a draft. Everything here goes through the
 * session client, so RLS re-checks the staff role.
 *
 * These return **form-ready strings**, which keeps the form components dumb
 * and the date/number conversions in one place.
 */

const str = (value: string | null): string => value ?? "";
const num = (value: number | null): string => (value === null ? "" : String(value));

/** `datetime-local` wants `YYYY-MM-DDTHH:mm`, not a full ISO string. */
function toLocalInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

/* ------------------------------------------------------------------------- */
/* Authors                                                                   */
/* ------------------------------------------------------------------------- */

export interface AdminAuthorRow {
  id: string;
  name: string;
  slug: string;
  title: string;
  bio: string;
  avatarUrl: string;
  linkX: string;
  linkLinkedin: string;
  linkWebsite: string;
  updatedAt: string;
}

interface AuthorRow {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  links: Record<string, string> | null;
  updated_at: string;
}

function mapAuthor(row: AuthorRow): AdminAuthorRow {
  const links = row.links ?? {};
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    title: str(row.title),
    bio: str(row.bio),
    avatarUrl: str(row.avatar_url),
    linkX: str(links.x ?? null),
    linkLinkedin: str(links.linkedin ?? null),
    linkWebsite: str(links.website ?? null),
    updatedAt: row.updated_at,
  };
}

export async function listAuthorsForAdmin(): Promise<AdminAuthorRow[] | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("authors")
    .select("id, name, slug, title, bio, avatar_url, links, updated_at")
    .order("name", { ascending: true });

  if (error || !data) return null;
  return (data as unknown as AuthorRow[]).map(mapAuthor);
}

export async function getAuthorForEdit(id: string): Promise<AdminAuthorRow | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("authors")
    .select("id, name, slug, title, bio, avatar_url, links, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapAuthor(data as unknown as AuthorRow);
}

/** Just enough to fill a byline dropdown. */
export interface AuthorOption {
  id: string;
  name: string;
}

export async function listAuthorOptions(): Promise<AuthorOption[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("authors")
    .select("id, name")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as unknown as AuthorOption[];
}

/* ------------------------------------------------------------------------- */
/* Reviews                                                                   */
/* ------------------------------------------------------------------------- */

export interface AdminReviewRow {
  id: string;
  toolId: string;
  toolName: string;
  title: string;
  slug: string;
  quickVerdict: string;
  score: string;
  /** `Label: 8.5` per line, matching how the form collects it. */
  breakdown: string;
  likes: string;
  improvements: string;
  featuresBody: string;
  pricingBody: string;
  experienceBody: string;
  audienceBody: string;
  finalVerdict: string;
  authorId: string;
  authorName: string;
  status: string;
  publishedAt: string;
  updatedAt: string;
}

interface ReviewEditRow {
  id: string;
  tool_id: string;
  title: string;
  slug: string;
  quick_verdict: string | null;
  score: number | null;
  breakdown: { label: string; score: number }[] | null;
  likes: string[] | null;
  improvements: string[] | null;
  features_body: string | null;
  pricing_body: string | null;
  experience_body: string | null;
  audience_body: string | null;
  final_verdict: string | null;
  author_id: string | null;
  status: string;
  published_at: string | null;
  updated_at: string;
  tools: { name: string } | null;
  authors: { name: string } | null;
}

const reviewSelection =
  "id, tool_id, title, slug, quick_verdict, score, breakdown, likes, improvements, features_body, pricing_body, experience_body, audience_body, final_verdict, author_id, status, published_at, updated_at, tools(name), authors(name)";

function mapReview(row: ReviewEditRow): AdminReviewRow {
  return {
    id: row.id,
    toolId: row.tool_id,
    toolName: row.tools?.name ?? "Unknown tool",
    title: row.title,
    slug: row.slug,
    quickVerdict: str(row.quick_verdict),
    score: num(row.score),
    breakdown: (row.breakdown ?? [])
      .map((criterion) => `${criterion.label}: ${criterion.score}`)
      .join("\n"),
    likes: (row.likes ?? []).join("\n"),
    improvements: (row.improvements ?? []).join("\n"),
    featuresBody: str(row.features_body),
    pricingBody: str(row.pricing_body),
    experienceBody: str(row.experience_body),
    audienceBody: str(row.audience_body),
    finalVerdict: str(row.final_verdict),
    authorId: str(row.author_id),
    authorName: row.authors?.name ?? "SaaSTally Editorial",
    status: row.status,
    publishedAt: toLocalInput(row.published_at),
    updatedAt: row.updated_at,
  };
}

export async function listReviewsForAdmin(): Promise<AdminReviewRow[] | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("reviews")
    .select(reviewSelection)
    .order("updated_at", { ascending: false });

  if (error || !data) return null;
  return (data as unknown as ReviewEditRow[]).map(mapReview);
}

export async function getReviewForEdit(id: string): Promise<AdminReviewRow | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("reviews")
    .select(reviewSelection)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapReview(data as unknown as ReviewEditRow);
}

/* ------------------------------------------------------------------------- */
/* Best lists                                                                */
/* ------------------------------------------------------------------------- */

export interface AdminBestListRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  intro: string;
  categoryId: string;
  categoryName: string;
  /** `tool-slug | blurb` per line, in position order — how the form collects it. */
  entries: string;
  toolCount: number;
  status: string;
  publishedAt: string;
  updatedAt: string;
}

interface BestListEditRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  intro: string | null;
  category_id: string | null;
  status: string;
  published_at: string | null;
  updated_at: string;
  categories: { name: string } | null;
  best_list_items:
    | { position: number; blurb: string | null; tools: { slug: string } | null }[]
    | null;
}

const bestListSelection =
  "id, title, slug, description, intro, category_id, status, published_at, updated_at, categories(name), best_list_items(position, blurb, tools(slug))";

function mapBestList(row: BestListEditRow): AdminBestListRow {
  const items = (row.best_list_items ?? [])
    .filter((item) => Boolean(item.tools?.slug))
    .sort((a, b) => a.position - b.position);

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: str(row.description),
    intro: str(row.intro),
    categoryId: str(row.category_id),
    categoryName: row.categories?.name ?? "—",
    entries: items
      .map((item) => (item.blurb ? `${item.tools!.slug} | ${item.blurb}` : item.tools!.slug))
      .join("\n"),
    toolCount: items.length,
    status: row.status,
    publishedAt: toLocalInput(row.published_at),
    updatedAt: row.updated_at,
  };
}

export async function listBestListsForAdmin(): Promise<AdminBestListRow[] | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("best_lists")
    .select(bestListSelection)
    .order("updated_at", { ascending: false });

  if (error || !data) return null;
  return (data as unknown as BestListEditRow[]).map(mapBestList);
}

export async function getBestListForEdit(id: string): Promise<AdminBestListRow | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("best_lists")
    .select(bestListSelection)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapBestList(data as unknown as BestListEditRow);
}

/* ------------------------------------------------------------------------- */
/* Comparisons                                                               */
/* ------------------------------------------------------------------------- */

export interface AdminComparisonRow {
  id: string;
  title: string;
  slug: string;
  toolAId: string;
  toolBId: string;
  toolAName: string;
  toolBName: string;
  quickVerdict: string;
  recommendation: string;
  /** `label | a | b | winner` per line — how the form collects it. */
  attributes: string;
  rowCount: number;
  status: string;
  publishedAt: string;
  updatedAt: string;
}

interface ComparisonEditRow {
  id: string;
  title: string;
  slug: string;
  tool_a_id: string | null;
  tool_b_id: string | null;
  quick_verdict: string | null;
  recommendation: string | null;
  attributes: { label: string; a: string; b: string; winner: string }[] | null;
  status: string;
  published_at: string | null;
  updated_at: string;
  tool_a: { name: string } | null;
  tool_b: { name: string } | null;
}

const comparisonSelection =
  "id, title, slug, tool_a_id, tool_b_id, quick_verdict, recommendation, attributes, status, published_at, updated_at, tool_a:tools!comparisons_tool_a_id_fkey(name), tool_b:tools!comparisons_tool_b_id_fkey(name)";

function mapComparison(row: ComparisonEditRow): AdminComparisonRow {
  const attributes = row.attributes ?? [];

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    toolAId: str(row.tool_a_id),
    toolBId: str(row.tool_b_id),
    toolAName: row.tool_a?.name ?? "—",
    toolBName: row.tool_b?.name ?? "—",
    quickVerdict: str(row.quick_verdict),
    recommendation: str(row.recommendation),
    attributes: attributes
      .map((attribute) => `${attribute.label} | ${attribute.a} | ${attribute.b} | ${attribute.winner}`)
      .join("\n"),
    rowCount: attributes.length,
    status: row.status,
    publishedAt: toLocalInput(row.published_at),
    updatedAt: row.updated_at,
  };
}

export async function listComparisonsForAdmin(): Promise<AdminComparisonRow[] | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("comparisons")
    .select(comparisonSelection)
    .order("updated_at", { ascending: false });

  if (error || !data) return null;
  return (data as unknown as ComparisonEditRow[]).map(mapComparison);
}

export async function getComparisonForEdit(id: string): Promise<AdminComparisonRow | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("comparisons")
    .select(comparisonSelection)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapComparison(data as unknown as ComparisonEditRow);
}

/* ------------------------------------------------------------------------- */
/* Articles                                                                  */
/* ------------------------------------------------------------------------- */

export interface AdminArticleRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  authorId: string;
  authorName: string;
  categorySlug: string;
  readingMinutes: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  status: string;
  publishedAt: string;
  updatedAt: string;
}

interface ArticleEditRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  author_id: string | null;
  category_slug: string | null;
  reading_minutes: number | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  status: string;
  published_at: string | null;
  updated_at: string;
  authors: { name: string } | null;
}

function mapArticle(row: ArticleEditRow): AdminArticleRow {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: str(row.excerpt),
    content: str(row.content),
    featuredImage: str(row.featured_image),
    authorId: str(row.author_id),
    authorName: row.authors?.name ?? "SaaSTally Editorial",
    categorySlug: str(row.category_slug),
    readingMinutes: num(row.reading_minutes),
    seoTitle: str(row.seo_title),
    seoDescription: str(row.seo_description),
    canonicalUrl: str(row.canonical_url),
    status: row.status,
    publishedAt: toLocalInput(row.published_at),
    updatedAt: row.updated_at,
  };
}

export async function listArticlesForAdmin(): Promise<AdminArticleRow[] | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("articles")
    .select("*, authors(name)")
    .order("updated_at", { ascending: false });

  if (error || !data) return null;
  return (data as unknown as ArticleEditRow[]).map(mapArticle);
}

export async function getArticleForEdit(id: string): Promise<AdminArticleRow | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("articles")
    .select("*, authors(name)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapArticle(data as unknown as ArticleEditRow);
}

export interface CategoryOption {
  id: string;
  name: string;
}

export async function listCategoryOptions(): Promise<CategoryOption[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as unknown as CategoryOption[];
}
