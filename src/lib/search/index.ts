import type { SearchResult, SearchResultType } from "@/types";
import { getTools } from "@/services/tools";
import { getCategories } from "@/services/categories";
import { getArticles } from "@/services/articles";
import { getComparisons } from "@/services/comparisons";
import { getBestLists } from "@/services/best-lists";
import { getReviews } from "@/services/reviews";

export interface IndexEntry extends Omit<SearchResult, "score"> {
  /** Lower-cased haystack: title + subtitle + keywords. */
  haystack: string;
}

/**
 * Builds a flat, in-memory search index from the service layer.
 *
 * Phase 1 keeps ranking in application code so it works identically in mock and
 * live mode. When the catalogue outgrows this (a few thousand rows), swap the
 * body of `search()` for a Postgres full-text query — the call sites and the
 * `SearchResult` shape do not have to change.
 */
export async function buildSearchIndex(): Promise<IndexEntry[]> {
  const [tools, categories, articles, comparisons, bestLists, reviews] = await Promise.all([
    getTools(),
    getCategories(),
    getArticles(),
    getComparisons(),
    getBestLists(),
    getReviews(),
  ]);

  const entries: IndexEntry[] = [];

  for (const tool of tools) {
    entries.push({
      id: `tool-${tool.slug}`,
      type: "tool",
      title: tool.name,
      subtitle: tool.shortDescription,
      href: `/tools/${tool.slug}`,
      haystack: [tool.name, tool.shortDescription, tool.bestFor, ...tool.categorySlugs]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    });
  }

  for (const category of categories) {
    entries.push({
      id: `category-${category.slug}`,
      type: "category",
      title: `${category.name} tools`,
      subtitle: category.description,
      href: `/categories/${category.slug}`,
      haystack: `${category.name} ${category.slug} ${category.description}`.toLowerCase(),
    });
  }

  for (const list of bestLists) {
    entries.push({
      id: `best-${list.slug}`,
      type: "best",
      title: list.title,
      subtitle: list.description,
      href: `/best/${list.slug}`,
      haystack: `${list.title} ${list.description} ${list.categorySlug}`.toLowerCase(),
    });
  }

  for (const comparison of comparisons) {
    entries.push({
      id: `compare-${comparison.slug}`,
      type: "comparison",
      title: comparison.title,
      subtitle: comparison.quickVerdict,
      href: `/compare/${comparison.slug}`,
      haystack: `${comparison.title} ${comparison.toolSlugs.join(" ")} vs`.toLowerCase(),
    });
  }

  for (const review of reviews) {
    entries.push({
      id: `review-${review.slug}`,
      type: "review",
      title: review.title,
      subtitle: review.quickVerdict,
      href: `/reviews/${review.slug}`,
      haystack: `${review.title} review ${review.toolSlug}`.toLowerCase(),
    });
  }

  for (const article of articles) {
    entries.push({
      id: `article-${article.slug}`,
      type: "article",
      title: article.title,
      subtitle: article.excerpt,
      href: `/articles/${article.slug}`,
      haystack: `${article.title} ${article.excerpt} ${article.categorySlug ?? ""}`.toLowerCase(),
    });
  }

  return entries;
}

const typeWeight: Record<SearchResultType, number> = {
  tool: 6,
  category: 5,
  best: 4,
  comparison: 3,
  review: 2,
  article: 1,
};

function scoreEntry(entry: IndexEntry, query: string): number {
  const title = entry.title.toLowerCase();
  let score = 0;

  if (title === query) score += 100;
  else if (title.startsWith(query)) score += 60;
  else if (title.includes(query)) score += 35;

  const terms = query.split(/\s+/).filter(Boolean);
  for (const term of terms) {
    if (entry.haystack.includes(term)) score += 8;
  }

  if (score === 0) return 0;
  return score + typeWeight[entry.type];
}

export async function search(rawQuery: string, limit = 8): Promise<SearchResult[]> {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < 2) return [];

  const index = await buildSearchIndex();

  return index
    .map((entry) => ({
      id: entry.id,
      type: entry.type,
      title: entry.title,
      subtitle: entry.subtitle,
      href: entry.href,
      score: scoreEntry(entry, query),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
