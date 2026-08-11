import { articles as fixtureArticles } from "@/data/articles";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createReadSupabase } from "@/lib/supabase/server";
import type { ArticleRow } from "@/lib/supabase/database.types";
import type { Article, ContentStatus } from "@/types";

function mapArticleRow(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    featuredImage: row.featured_image,
    status: (row.status as ContentStatus) ?? "draft",
    authorName: row.author_name ?? "SaaSTally Editorial",
    categorySlug: row.category_slug,
    readingMinutes: row.reading_minutes ?? 5,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    canonicalUrl: row.canonical_url,
    publishedAt: row.published_at ?? row.created_at,
    updatedAt: row.updated_at,
  };
}

async function liveArticles(): Promise<Article[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createReadSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error || !data) return null;
  return (data as unknown as ArticleRow[]).map(mapArticleRow);
}

export async function getArticles(): Promise<Article[]> {
  const live = await liveArticles();
  if (live) return live;
  return fixtureArticles
    .filter((article) => article.status === "published")
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function getLatestArticles(limit = 4): Promise<Article[]> {
  return (await getArticles()).slice(0, limit);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const all = await getArticles();
  return all.find((article) => article.slug === slug) ?? null;
}

export async function getArticleSlugs(): Promise<string[]> {
  return (await getArticles()).map((article) => article.slug);
}
