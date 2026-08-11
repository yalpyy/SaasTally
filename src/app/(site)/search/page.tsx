import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import { ResultList } from "@/components/search/result-list";
import { EmptyState } from "@/components/ui/empty-state";
import { search } from "@/lib/search";
import { buildMetadata } from "@/lib/seo/metadata";

/**
 * Search results are intentionally noindex — thin, infinite-permutation pages
 * are a classic way to dilute a site's crawl budget.
 */
export const metadata: Metadata = buildMetadata({
  title: "Search",
  description: "Search software, categories, comparisons and guides on SaaSTally.",
  path: "/search",
  noIndex: true,
});

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query.length >= 2 ? await search(query, 30) : [];

  return (
    <>
      <PageHeader
        title={query ? `Results for “${query}”` : "Search"}
        description={
          query
            ? `${results.length} result${results.length === 1 ? "" : "s"} across software, categories, comparisons and guides.`
            : "Search software, categories, comparisons and guides."
        }
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Search", href: "/search" },
        ]}
      />

      <Container className="py-12 sm:py-16">
        {results.length > 0 ? (
          <ResultList results={results} className="max-w-2xl" />
        ) : (
          <EmptyState
            icon={<SearchX className="size-5" aria-hidden="true" />}
            title={query ? "No results found" : "Start typing to search"}
            description={
              query
                ? "Try a broader term — a category like “SEO”, a tool name, or a use case such as “email marketing”."
                : "Search software, categories, comparisons and guides."
            }
          />
        )}
      </Container>
    </>
  );
}
