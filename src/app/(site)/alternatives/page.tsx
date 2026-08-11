import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import { ToolLogo } from "@/components/ui/tool-logo";
import { getTools } from "@/services/tools";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = buildMetadata({
  title: "Software alternatives",
  description:
    "Looking to replace a tool? Browse credible alternatives with the trade-offs stated plainly.",
  path: "/alternatives",
});

export default async function AlternativesIndexPage() {
  const tools = (await getTools()).filter((tool) => tool.alternativeSlugs.length > 0);
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Alternatives", href: "/alternatives" },
  ];

  return (
    <>
      <PageHeader
        title="Alternatives"
        description="Every switch has a cost. These pages state what you gain and what you give up."
        breadcrumbs={breadcrumbs}
      />

      <Container className="py-12 sm:py-16">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <li key={tool.id}>
              <Link
                href={`/alternatives/${tool.slug}`}
                className="flex items-center gap-3 rounded-card border border-border bg-card p-4 transition-colors hover:border-border-strong hover:bg-card-hover"
              >
                <ToolLogo name={tool.name} src={tool.logoUrl} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{tool.name} alternatives</span>
                  <span className="block truncate text-xs text-subtle">
                    {tool.alternativeSlugs.length} option
                    {tool.alternativeSlugs.length === 1 ? "" : "s"}
                  </span>
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
