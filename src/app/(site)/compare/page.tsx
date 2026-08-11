import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import { ComparisonCard } from "@/components/comparison/comparison-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getComparisons } from "@/services/comparisons";
import { getToolsBySlugs } from "@/services/tools";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = buildMetadata({
  title: "Software comparisons",
  description:
    "Side-by-side software comparisons with the criteria stated up front, so you can weigh them yourself.",
  path: "/compare",
});

export default async function ComparePage() {
  const comparisons = await getComparisons();
  const withTools = await Promise.all(
    comparisons.map(async (comparison) => ({
      comparison,
      tools: await getToolsBySlugs([...comparison.toolSlugs]),
    })),
  );

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Comparisons", href: "/compare" },
  ];

  return (
    <>
      <PageHeader
        title="Comparisons"
        description="Compare before you commit. Every comparison states its criteria before its conclusion."
        breadcrumbs={breadcrumbs}
      />

      <Container className="py-12 sm:py-16">
        {withTools.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {withTools.map(({ comparison, tools }) => (
              <ComparisonCard key={comparison.id} comparison={comparison} tools={tools} />
            ))}
          </div>
        ) : (
          <EmptyState title="No comparisons yet" description="The first comparisons are being written." />
        )}
      </Container>

      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
    </>
  );
}
