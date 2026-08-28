import type { MetadataRoute } from "next";
import { getToolSlugs } from "@/services/tools";
import { getCategorySlugs } from "@/services/categories";
import { getArticles } from "@/services/articles";
import { getComparisons } from "@/services/comparisons";
import { getReviews } from "@/services/reviews";
import { getBestListSlugs } from "@/services/best-lists";
import { absoluteUrl } from "@/lib/site";

/**
 * Dynamic sitemap.
 *
 * Excluded on purpose: /admin, /api, /go and /search — none of which should
 * ever be surfaced to a crawler.
 *
 * Revalidated hourly for the same reason the site pages are: a sitemap frozen
 * at build time would keep pointing crawlers at yesterday's catalogue and omit
 * everything published since.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [toolSlugs, categorySlugs, articles, comparisons, reviews, bestSlugs] = await Promise.all([
    getToolSlugs(),
    getCategorySlugs(),
    getArticles(),
    getComparisons(),
    getReviews(),
    getBestListSlugs(),
  ]);

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/software"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/categories"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/compare"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/reviews"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/best"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/articles"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: absoluteUrl("/alternatives"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    {
      url: absoluteUrl("/affiliate-disclosure"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    { url: absoluteUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const toolEntries: MetadataRoute.Sitemap = toolSlugs.flatMap((slug) => [
    { url: absoluteUrl(`/tools/${slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    {
      url: absoluteUrl(`/alternatives/${slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ]);

  const categoryEntries: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: absoluteUrl(`/categories/${slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const bestEntries: MetadataRoute.Sitemap = bestSlugs.map((slug) => ({
    url: absoluteUrl(`/best/${slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const comparisonEntries: MetadataRoute.Sitemap = comparisons.map((comparison) => ({
    url: absoluteUrl(`/compare/${comparison.slug}`),
    lastModified: new Date(comparison.updatedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const reviewEntries: MetadataRoute.Sitemap = reviews.map((review) => ({
    url: absoluteUrl(`/reviews/${review.slug}`),
    lastModified: new Date(review.updatedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: absoluteUrl(`/articles/${article.slug}`),
    lastModified: new Date(article.updatedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...staticEntries,
    ...toolEntries,
    ...categoryEntries,
    ...bestEntries,
    ...comparisonEntries,
    ...reviewEntries,
    ...articleEntries,
  ];
}
