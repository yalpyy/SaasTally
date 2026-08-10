import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import { ToolCard } from "@/components/tools/tool-card";
import { EmptyState } from "@/components/ui/empty-state";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { getToolBySlug, getToolSlugs, getToolsBySlugs } from "@/services/tools";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export async function generateStaticParams() {
  const slugs = await getToolSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    return buildMetadata({
      title: "Alternatives not found",
      description: "This tool does not exist.",
      path: `/alternatives/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${tool.name} alternatives`,
    description: `Credible alternatives to ${tool.name}, with the trade-offs stated plainly — pricing, strengths and who each option suits.`,
    path: `/alternatives/${tool.slug}`,
  });
}

export default async function AlternativesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  const alternatives = await getToolsBySlugs(tool.alternativeSlugs);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Alternatives", href: "/alternatives" },
    { label: `${tool.name} alternatives`, href: `/alternatives/${tool.slug}` },
  ];

  return (
    <>
      <PageHeader
        title={`${tool.name} alternatives`}
        description={`If ${tool.name} is not the right fit, these are the options worth evaluating next.`}
        breadcrumbs={breadcrumbs}
      />

      <Container className="py-12 sm:py-16">
        {alternatives.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alternatives.map((alternative) => (
              <ToolCard key={alternative.id} tool={alternative} sourceType="tool" />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No alternatives published yet"
            description="We only list alternatives we can compare fairly."
            action={
              <Link
                href={`/tools/${tool.slug}`}
                className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-card-hover"
              >
                Back to {tool.name}
              </Link>
            }
          />
        )}

        <AffiliateDisclosure className="mt-10" />
      </Container>

      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
    </>
  );
}
