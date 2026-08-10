import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { CategoryStrip } from "@/components/marketing/category-strip";
import { FeaturedTools } from "@/components/marketing/featured-tools";
import { CategoryGrid } from "@/components/marketing/category-grid";
import { ComparisonSpotlight } from "@/components/marketing/comparison-spotlight";
import { BestByUseCase } from "@/components/marketing/best-by-usecase";
import { LatestGuides } from "@/components/marketing/latest-guides";
import { TrustSection } from "@/components/marketing/trust-section";
import { Newsletter } from "@/components/marketing/newsletter";
import { getFeaturedTools, getToolsBySlugs } from "@/services/tools";
import { getFeaturedCategories } from "@/services/categories";
import { getComparisons } from "@/services/comparisons";
import { getBestLists } from "@/services/best-lists";
import { getLatestArticles } from "@/services/articles";
import { buildMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  path: "/",
});

export default async function HomePage() {
  const [tools, categories, comparisons, bestLists, articles] = await Promise.all([
    getFeaturedTools(6),
    getFeaturedCategories(12),
    getComparisons(),
    getBestLists(),
    getLatestArticles(4),
  ]);

  const spotlight = comparisons[0] ?? null;
  const spotlightTools = spotlight ? await getToolsBySlugs([...spotlight.toolSlugs]) : [];

  return (
    <>
      <Hero />
      <CategoryStrip categories={categories} />
      <FeaturedTools tools={tools} />
      <CategoryGrid categories={categories} />
      {spotlight && spotlightTools.length === 2 ? (
        <ComparisonSpotlight comparison={spotlight} tools={spotlightTools} />
      ) : null}
      <BestByUseCase lists={bestLists} />
      <LatestGuides articles={articles} />
      <TrustSection />
      <Newsletter />
    </>
  );
}
