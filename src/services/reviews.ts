import { reviews as fixtureReviews } from "@/data/reviews";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createReadSupabase } from "@/lib/supabase/server";
import type { ContentStatus, RatingCriterion, Review } from "@/types";

/**
 * Review reads.
 *
 * Anonymous client, so RLS decides what is visible: only `published` rows
 * reach a visitor, and the filter below is the same rule stated twice on
 * purpose — it also holds in mock mode, where there is no RLS at all.
 */

interface ReviewRow {
  id: string;
  title: string;
  slug: string;
  quick_verdict: string | null;
  score: number | null;
  breakdown: RatingCriterion[] | null;
  likes: string[] | null;
  improvements: string[] | null;
  features_body: string | null;
  pricing_body: string | null;
  experience_body: string | null;
  audience_body: string | null;
  final_verdict: string | null;
  status: ContentStatus;
  published_at: string | null;
  updated_at: string;
  tools: { slug: string } | null;
  authors: { name: string; slug: string } | null;
}

const str = (value: string | null): string => value ?? "";

function mapReviewRow(row: ReviewRow): Review {
  return {
    id: row.id,
    toolSlug: row.tools?.slug ?? "",
    title: row.title,
    slug: row.slug,
    quickVerdict: str(row.quick_verdict),
    score: row.score ?? 0,
    breakdown: row.breakdown ?? [],
    likes: row.likes ?? [],
    improvements: row.improvements ?? [],
    featuresBody: str(row.features_body),
    pricingBody: str(row.pricing_body),
    experienceBody: str(row.experience_body),
    audienceBody: str(row.audience_body),
    finalVerdict: str(row.final_verdict),
    // Falls back to the house byline rather than inventing a person.
    authorName: row.authors?.name ?? "SaaSTally Editorial",
    authorSlug: row.authors?.slug ?? null,
    status: row.status,
    publishedAt: row.published_at ?? row.updated_at,
    updatedAt: row.updated_at,
  };
}

async function liveReviews(): Promise<Review[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createReadSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, title, slug, quick_verdict, score, breakdown, likes, improvements, features_body, pricing_body, experience_body, audience_body, final_verdict, status, published_at, updated_at, tools(slug), authors(name, slug)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error || !data) return null;

  return (data as unknown as ReviewRow[]).map(mapReviewRow);
}

export async function getReviews(): Promise<Review[]> {
  const live = await liveReviews();
  if (live) return live;

  return fixtureReviews
    .filter((review) => review.status === "published")
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function getReviewBySlug(slug: string): Promise<Review | null> {
  const all = await getReviews();
  return all.find((review) => review.slug === slug) ?? null;
}

export async function getReviewForTool(toolSlug: string): Promise<Review | null> {
  const all = await getReviews();
  return all.find((review) => review.toolSlug === toolSlug) ?? null;
}

export async function getReviewSlugs(): Promise<string[]> {
  return (await getReviews()).map((review) => review.slug);
}
