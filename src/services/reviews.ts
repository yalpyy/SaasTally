import { reviews as fixtureReviews } from "@/data/reviews";
import type { Review } from "@/types";

export async function getReviews(): Promise<Review[]> {
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
