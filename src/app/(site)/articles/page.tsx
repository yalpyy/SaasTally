import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import { ArticleCard } from "@/components/articles/article-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getArticles } from "@/services/articles";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = buildMetadata({
  title: "Guides",
  description:
    "Practical guides on choosing, comparing and budgeting for software, written by the SaaSTally editorial team.",
  path: "/articles",
});

export default async function ArticlesPage() {
  const articles = await getArticles();
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Guides", href: "/articles" },
  ];

  return (
    <>
      <PageHeader
        title="Guides"
        description="How to choose, compare and budget for software without relying on vendor marketing."
        breadcrumbs={breadcrumbs}
      />

      <Container className="py-12 sm:py-16">
        {articles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <EmptyState title="No guides published yet" description="The first guides are in progress." />
        )}
      </Container>

      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
    </>
  );
}
