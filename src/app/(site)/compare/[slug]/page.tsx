import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, Minus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToolLogo } from "@/components/ui/tool-logo";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { getComparisonBySlug, getComparisonSlugs } from "@/services/comparisons";
import { getToolsBySlugs } from "@/services/tools";
import { affiliateHref, affiliateLinkAttributes } from "@/lib/affiliate/links";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema, comparisonSchema } from "@/lib/seo/jsonld";
import { formatDate } from "@/lib/utils/format";
import type { Tool } from "@/types";

export async function generateStaticParams() {
  const slugs = await getComparisonSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const comparison = await getComparisonBySlug(slug);

  if (!comparison) {
    return buildMetadata({
      title: "Comparison not found",
      description: "This comparison does not exist.",
      path: `/compare/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${comparison.title}: which should you choose?`,
    description: comparison.quickVerdict,
    path: `/compare/${comparison.slug}`,
    type: "article",
    publishedTime: comparison.publishedAt,
    modifiedTime: comparison.updatedAt,
  });
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comparison = await getComparisonBySlug(slug);
  if (!comparison) notFound();

  const tools = await getToolsBySlugs([...comparison.toolSlugs]);
  const [a, b] = tools;
  if (!a || !b) notFound();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Comparisons", href: "/compare" },
    { label: comparison.title, href: `/compare/${comparison.slug}` },
  ];

  const wins = (side: "a" | "b") =>
    comparison.attributes.filter((attribute) => attribute.winner === side).length;

  return (
    <>
      <div className="border-b border-border bg-elevated/50 py-10 sm:py-14">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-[44px]">
            {comparison.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
            {comparison.quickVerdict}
          </p>

          <div className="mt-8 grid items-stretch gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <ContenderCard tool={a} wins={wins("a")} slug={comparison.slug} />
            <span className="mx-auto flex size-11 items-center justify-center self-center rounded-full border border-border bg-background text-xs font-semibold uppercase tracking-wider text-subtle">
              vs
            </span>
            <ContenderCard tool={b} wins={wins("b")} slug={comparison.slug} />
          </div>

          <p className="mt-4 text-xs text-subtle">Updated {formatDate(comparison.updatedAt)}</p>
        </Container>
      </div>

      <Container className="py-12 sm:py-16">
        <section aria-labelledby="feature-comparison">
          <h2 id="feature-comparison" className="text-xl font-semibold sm:text-2xl">
            Feature comparison
          </h2>

          {/* Desktop: real table. Mobile: stacked cards (never a scrolling table). */}
          <div className="mt-5 hidden overflow-hidden rounded-card border border-border md:block">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">{comparison.title} feature comparison</caption>
              <thead>
                <tr className="bg-elevated">
                  <th scope="col" className="w-1/4 px-5 py-3.5 text-left font-medium text-subtle">
                    Criteria
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-left font-semibold">
                    {a.name}
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-left font-semibold">
                    {b.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.attributes.map((attribute) => (
                  <tr key={attribute.label} className="border-t border-border bg-card">
                    <th scope="row" className="px-5 py-4 text-left font-medium text-muted">
                      {attribute.label}
                    </th>
                    <td className="px-5 py-4">
                      <Value text={attribute.a} winner={attribute.winner === "a"} />
                    </td>
                    <td className="px-5 py-4">
                      <Value text={attribute.b} winner={attribute.winner === "b"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-5 space-y-3 md:hidden">
            {comparison.attributes.map((attribute) => (
              <li key={attribute.label}>
                <Card className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                    {attribute.label}
                  </p>
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-xs text-subtle">{a.name}</p>
                      <Value text={attribute.a} winner={attribute.winner === "a"} />
                    </div>
                    <div className="border-t border-border pt-3">
                      <p className="text-xs text-subtle">{b.name}</p>
                      <Value text={attribute.b} winner={attribute.winner === "b"} />
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="recommendation" className="mt-16">
          <h2 id="recommendation" className="text-xl font-semibold sm:text-2xl">
            Final recommendation
          </h2>
          <Card className="mt-4 border-l-2 border-l-primary p-6">
            <p className="text-[15px] leading-relaxed">{comparison.recommendation}</p>
          </Card>
        </section>

        <AffiliateDisclosure variant="panel" className="mt-10" />
      </Container>

      <JsonLd data={[breadcrumbSchema(breadcrumbs), comparisonSchema(comparison)]} />
    </>
  );
}

function Value({ text, winner }: { text: string; winner: boolean }) {
  return (
    <span className="flex items-start gap-2 text-sm">
      {winner ? (
        <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      ) : (
        <Minus className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden="true" />
      )}
      <span className={winner ? "text-foreground" : "text-muted"}>{text}</span>
    </span>
  );
}

function ContenderCard({ tool, wins, slug }: { tool: Tool; wins: number; slug: string }) {
  const href = tool.sponsored
    ? affiliateHref(tool.slug, { sourceType: "comparison", source: `/compare/${slug}`, position: "comparison" })
    : tool.websiteUrl;

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center gap-3">
        <ToolLogo name={tool.name} src={tool.logoUrl} size={44} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{tool.name}</p>
          <p className="truncate text-xs text-subtle">{tool.shortDescription}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="primary">Wins {wins} criteria</Badge>
        {tool.startingPrice ? <Badge tone="outline">{tool.startingPrice}</Badge> : null}
      </div>

      <div className="mt-5 flex gap-2">
        <a
          href={href}
          {...affiliateLinkAttributes}
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Visit
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </a>
        <Link
          href={`/tools/${tool.slug}`}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border text-sm font-medium transition-colors hover:bg-card-hover"
        >
          Details
        </Link>
      </div>
    </Card>
  );
}
