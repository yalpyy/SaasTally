import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import { ToolCard } from "@/components/tools/tool-card";
import { EmptyState } from "@/components/ui/empty-state";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { getTools } from "@/services/tools";
import { getCategories } from "@/services/categories";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = buildMetadata({
  title: "All software",
  description:
    "Browse every tool tracked by SaaSTally, filtered by category, with independent ratings and pricing signals.",
  path: "/software",
});

export default async function SoftwarePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [tools, categories] = await Promise.all([getTools(), getCategories()]);

  const filtered = category ? tools.filter((tool) => tool.categorySlugs.includes(category)) : tools;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Software", href: "/software" },
  ];

  return (
    <>
      <PageHeader
        title="All software"
        description="Every tool we track, with editorial ratings, pricing signals and links to full reviews."
        breadcrumbs={breadcrumbs}
      />

      <Container className="py-12 sm:py-16">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          <FilterChip href="/software" active={!category}>
            All
          </FilterChip>
          {categories.map((item) => (
            <FilterChip
              key={item.slug}
              href={`/software?category=${item.slug}`}
              active={category === item.slug}
            >
              {item.name}
            </FilterChip>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool) => (
              <ToolCard key={tool.id} tool={tool} sourceType="category" />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-8"
            icon={<PackageSearch className="size-5" aria-hidden="true" />}
            title="Nothing here yet"
            description="We have not published tools in this category yet. Try another category or browse everything."
            action={
              <Link
                href="/software"
                className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-card-hover"
              >
                Browse all software
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

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-2 text-sm transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border text-muted hover:border-border-strong hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
