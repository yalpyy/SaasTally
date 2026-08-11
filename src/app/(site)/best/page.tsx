import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Trophy } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import { getBestLists } from "@/services/best-lists";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = buildMetadata({
  title: "Best software shortlists",
  description:
    "Curated shortlists of the best software by use case — SEO, AI, CRM, hosting, project management and email marketing.",
  path: "/best",
});

export default async function BestIndexPage() {
  const lists = await getBestLists();
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Best Tools", href: "/best" },
  ];

  return (
    <>
      <PageHeader
        title="Best software by use case"
        description="Short, opinionated lists. Each pick states who it is for and who it is not for."
        breadcrumbs={breadcrumbs}
      />

      <Container className="py-12 sm:py-16">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <li key={list.slug}>
              <Link
                href={`/best/${list.slug}`}
                className="group flex h-full items-center gap-4 rounded-card border border-border bg-card p-5 transition-colors hover:border-border-strong hover:bg-card-hover"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-elevated text-primary">
                  <Trophy className="size-[18px]" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{list.title}</span>
                  <span className="mt-1 block text-sm text-muted">{list.description}</span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-subtle" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
    </>
  );
}
