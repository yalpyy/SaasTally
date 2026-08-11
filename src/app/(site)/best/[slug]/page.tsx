import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import { ToolCard } from "@/components/tools/tool-card";
import { EmptyState } from "@/components/ui/empty-state";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { getBestListBySlug, getBestListSlugs } from "@/services/best-lists";
import { getToolsBySlugs } from "@/services/tools";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";
import { formatDate } from "@/lib/utils/format";

export async function generateStaticParams() {
  const slugs = await getBestListSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const list = await getBestListBySlug(slug);

  if (!list) {
    return buildMetadata({
      title: "List not found",
      description: "This shortlist does not exist.",
      path: `/best/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: list.title,
    description: list.description,
    path: `/best/${list.slug}`,
  });
}

export default async function BestListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const list = await getBestListBySlug(slug);
  if (!list) notFound();

  const tools = await getToolsBySlugs(list.toolSlugs);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Best Tools", href: "/best" },
    { label: list.title, href: `/best/${list.slug}` },
  ];

  return (
    <>
      <PageHeader
        title={list.title}
        description={list.description}
        breadcrumbs={breadcrumbs}
        meta={<p className="text-xs text-subtle">Updated {formatDate(list.updatedAt)}</p>}
      />

      <Container className="py-12 sm:py-16">
        {tools.length > 0 ? (
          <ol className="space-y-4">
            {tools.map((tool, index) => (
              <li key={tool.id} className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
                <span
                  aria-hidden="true"
                  className="hidden size-10 items-center justify-center rounded-xl border border-border bg-elevated text-sm font-semibold text-subtle sm:flex"
                >
                  {index + 1}
                </span>
                <ToolCard tool={tool} sourceType="best" position="best-list" />
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            title="This shortlist is being researched"
            description="We publish a list once there are enough tools we can defend recommending."
          />
        )}

        <AffiliateDisclosure className="mt-10" />
      </Container>

      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
    </>
  );
}
