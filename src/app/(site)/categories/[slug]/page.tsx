import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import { ToolCard } from "@/components/tools/tool-card";
import { EmptyState } from "@/components/ui/empty-state";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { getCategoryBySlug, getCategorySlugs } from "@/services/categories";
import { getToolsByCategory } from "@/services/tools";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export async function generateStaticParams() {
  const slugs = await getCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return buildMetadata({
      title: "Category not found",
      description: "This category does not exist.",
      path: `/categories/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `Best ${category.name} software`,
    description: `${category.description} Compare ${category.name.toLowerCase()} tools with independent ratings, pricing and alternatives.`,
    path: `/categories/${category.slug}`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const tools = await getToolsByCategory(category.slug);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Categories", href: "/categories" },
    { label: category.name, href: `/categories/${category.slug}` },
  ];

  return (
    <>
      <PageHeader
        title={`${category.name} software`}
        description={category.description}
        breadcrumbs={breadcrumbs}
      />

      <Container className="py-12 sm:py-16">
        {tools.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} sourceType="category" />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<PackageSearch className="size-5" aria-hidden="true" />}
            title={`No ${category.name} tools published yet`}
            description="This category is on the editorial roadmap. Check back soon."
          />
        )}

        <AffiliateDisclosure className="mt-10" />
      </Container>

      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
    </>
  );
}
