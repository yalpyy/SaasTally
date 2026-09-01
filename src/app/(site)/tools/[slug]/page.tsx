import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowUpRight, GitCompareArrows, Star } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";
import { ToolLogo } from "@/components/ui/tool-logo";
import { ProsCons } from "@/components/ui/pros-cons";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { CollectionNotice } from "@/components/tools/collection-notice";
import { ToolCard } from "@/components/tools/tool-card";
import { ArticleCard } from "@/components/articles/article-card";
import { getToolBySlug, getToolSlugs, getToolsBySlugs } from "@/services/tools";
import { getComparisonsForTool } from "@/services/comparisons";
import { getReviewForTool } from "@/services/reviews";
import { getArticles } from "@/services/articles";
import { affiliateHref, affiliateLinkAttributes } from "@/lib/affiliate/links";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  JsonLd,
  breadcrumbSchema,
  faqSchema,
  softwareApplicationSchema,
} from "@/lib/seo/jsonld";
import { formatDate, titleFromSlug } from "@/lib/utils/format";

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
      title: "Tool not found",
      description: "This tool does not exist.",
      path: `/tools/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: tool.seoTitle ?? `${tool.name} — features, pricing and alternatives`,
    description:
      tool.seoDescription ??
      `${tool.name}: ${tool.shortDescription}. Independent overview of features, pricing, pros and cons, and the closest alternatives.`,
    path: `/tools/${tool.slug}`,
  });
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  const [alternatives, comparisons, review, articles] = await Promise.all([
    getToolsBySlugs(tool.alternativeSlugs),
    getComparisonsForTool(tool.slug),
    getReviewForTool(tool.slug),
    getArticles(),
  ]);

  const relatedGuides = articles
    .filter((article) => article.categorySlug && tool.categorySlugs.includes(article.categorySlug))
    .slice(0, 2);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Software", href: "/software" },
    { label: tool.name, href: `/tools/${tool.slug}` },
  ];

  const ctaHref = tool.sponsored
    ? affiliateHref(tool.slug, { sourceType: "tool", source: `/tools/${tool.slug}`, position: "tool-header" })
    : tool.websiteUrl;

  const faq = faqSchema(tool.faqs);

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-b border-border bg-elevated/50 py-10 sm:py-14">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-4">
                <ToolLogo name={tool.name} src={tool.logoUrl} size={64} className="rounded-2xl" />
                <div className="min-w-0">
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{tool.name}</h1>
                  <p className="mt-1.5 text-[15px] text-muted">{tool.shortDescription}</p>
                </div>
              </div>

              <dl className="mt-7 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                {tool.rating !== null ? (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.12em] text-subtle">Rating</dt>
                    <dd className="mt-1.5 flex items-baseline gap-1.5">
                      <Rating value={tool.rating} size="md" />
                      <span className="text-sm text-subtle">/ 5</span>
                    </dd>
                  </div>
                ) : null}

                {tool.categorySlugs[0] ? (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.12em] text-subtle">Category</dt>
                    <dd className="mt-1.5">
                      <Link
                        href={`/categories/${tool.categorySlugs[0]}`}
                        className="text-sm font-medium underline-offset-4 hover:underline"
                      >
                        {titleFromSlug(tool.categorySlugs[0])}
                      </Link>
                    </dd>
                  </div>
                ) : null}

                {tool.bestFor ? (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.12em] text-subtle">Best for</dt>
                    <dd className="mt-1.5 text-sm font-medium">{tool.bestFor}</dd>
                  </div>
                ) : null}

                {tool.startingPrice ? (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.12em] text-subtle">
                      Starting price
                    </dt>
                    <dd className="mt-1.5 text-sm font-medium">{tool.startingPrice}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <Card className="w-full shrink-0 p-5 lg:w-[300px]">
              <a
                href={ctaHref}
                {...affiliateLinkAttributes}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Visit {tool.name}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>

              <div className="mt-2 grid grid-cols-2 gap-2">
                {comparisons[0] ? (
                  <Link
                    href={`/compare/${comparisons[0].slug}`}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-card-hover"
                  >
                    <GitCompareArrows className="size-3.5" aria-hidden="true" />
                    Compare
                  </Link>
                ) : null}
                {review ? (
                  <Link
                    href={`/reviews/${review.slug}`}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-card-hover"
                  >
                    <Star className="size-3.5" aria-hidden="true" />
                    Read Review
                  </Link>
                ) : null}
              </div>

              {tool.sponsored ? (
                <p className="mt-4 text-xs leading-relaxed text-subtle">
                  This is an affiliate link. {" "}
                  <Link href="/affiliate-disclosure" className="underline underline-offset-4">
                    How this works
                  </Link>
                </p>
              ) : null}

              <p className="mt-4 border-t border-border pt-4 text-xs text-subtle">
                Last updated {formatDate(tool.updatedAt)}
              </p>
            </Card>
          </div>
        </Container>
      </div>

      <Container className="py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-14">
            <section aria-labelledby="overview">
              <h2 id="overview" className="text-xl font-semibold sm:text-2xl">
                Overview
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">{tool.description}</p>
              <CollectionNotice tool={tool} className="mt-6" />
              <AffiliateDisclosure variant="panel" className="mt-6" />
            </section>

            {tool.features.length > 0 ? (
              <section aria-labelledby="features">
                <h2 id="features" className="text-xl font-semibold sm:text-2xl">
                  Key features
                </h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {tool.features.map((feature) => (
                    <li
                      key={feature}
                      className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {tool.pricingTiers.length > 0 ? (
              <section aria-labelledby="pricing">
                <h2 id="pricing" className="text-xl font-semibold sm:text-2xl">
                  Pricing
                </h2>
                <p className="mt-2 text-sm text-subtle">
                  Pricing changes frequently — always confirm on the vendor site before purchasing.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tool.pricingTiers.map((tier) => (
                    <Card key={tier.name} className="flex flex-col p-5">
                      <h3 className="text-sm font-semibold">{tier.name}</h3>
                      <p className="mt-2 text-lg font-semibold">{tier.price}</p>
                      <p className="mt-2 text-sm text-muted">{tier.description}</p>
                      <ul className="mt-4 space-y-1.5 border-t border-border pt-4">
                        {tier.highlights.map((highlight) => (
                          <li key={highlight} className="text-sm text-subtle">
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}

            <section aria-labelledby="pros-cons">
              <h2 id="pros-cons" className="mb-5 text-xl font-semibold sm:text-2xl">
                Pros and cons
              </h2>
              <ProsCons pros={tool.pros} cons={tool.cons} />
            </section>

            {tool.bestFor ? (
              <section aria-labelledby="best-for">
                <h2 id="best-for" className="text-xl font-semibold sm:text-2xl">
                  Best for
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  {tool.name} fits teams focused on {tool.bestFor.toLowerCase()}. If that does not
                  describe your work, check the alternatives below before committing to a plan.
                </p>
              </section>
            ) : null}

            {tool.screenshots.length > 0 ? (
              <section aria-labelledby="screenshots">
                <h2 id="screenshots" className="text-xl font-semibold sm:text-2xl">
                  Screenshots
                </h2>

                {/*
                  Rendered only when there are some. The section used to show two
                  dashed "awaiting screenshot" boxes on every tool, which made a
                  finished page look unfinished on all of them at once.
                */}
                <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                  {tool.screenshots.map((shot) => (
                    <li key={shot.path}>
                      <figure>
                        <div className="relative aspect-16/10 overflow-hidden rounded-card border border-border bg-elevated">
                          <Image
                            src={shot.url}
                            alt={shot.caption ?? `${tool.name} screenshot`}
                            fill
                            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw"
                            className="object-cover"
                          />
                        </div>
                        {shot.caption ? (
                          <figcaption className="mt-2 text-xs text-subtle">{shot.caption}</figcaption>
                        ) : null}
                      </figure>
                    </li>
                  ))}
                </ul>

                <p className="mt-3 text-xs text-subtle">
                  Screenshots are taken and uploaded by our editors — never collected automatically.
                </p>
              </section>
            ) : null}

            {tool.verdict ? (
              <section aria-labelledby="verdict">
                <h2 id="verdict" className="text-xl font-semibold sm:text-2xl">
                  SaaSTally verdict
                </h2>
                <Card className="mt-4 border-l-2 border-l-primary p-6">
                  <p className="text-[15px] leading-relaxed">{tool.verdict}</p>
                  {tool.rating !== null ? (
                    <p className="mt-4 flex items-center gap-2 text-sm text-subtle">
                      Editorial score
                      <Rating value={tool.rating} size="md" />
                    </p>
                  ) : null}
                </Card>
              </section>
            ) : null}

            {tool.faqs.length > 0 ? (
              <section aria-labelledby="faq">
                <h2 id="faq" className="text-xl font-semibold sm:text-2xl">
                  Frequently asked questions
                </h2>
                <div className="mt-5 divide-y divide-border overflow-hidden rounded-card border border-border">
                  {tool.faqs.map((item) => (
                    <details key={item.question} className="group bg-card p-5 open:bg-card-hover">
                      <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
                        {item.question}
                      </summary>
                      <p className="mt-3 text-sm leading-relaxed text-muted">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Sidebar                                                          */}
          {/* ---------------------------------------------------------------- */}
          <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
            {tool.companyName ? (
              <Card className="p-5">
                <h2 className="text-sm font-semibold">Company</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-subtle">Name</dt>
                    <dd className="text-right">{tool.companyName}</dd>
                  </div>
                  {tool.foundedYear ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-subtle">Founded</dt>
                      <dd>{tool.foundedYear}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-3">
                    <dt className="text-subtle">Pricing</dt>
                    <dd className="text-right capitalize">{tool.pricingModel.replace(/-/g, " ")}</dd>
                  </div>
                </dl>
              </Card>
            ) : null}

            {tool.categorySlugs.length > 0 ? (
              <Card className="p-5">
                <h2 className="text-sm font-semibold">Categories</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tool.categorySlugs.map((categorySlug) => (
                    <Link key={categorySlug} href={`/categories/${categorySlug}`}>
                      <Badge tone="outline">{titleFromSlug(categorySlug)}</Badge>
                    </Link>
                  ))}
                </div>
              </Card>
            ) : null}
          </aside>
        </div>

        {alternatives.length > 0 ? (
          <section aria-labelledby="alternatives" className="mt-16">
            <h2 id="alternatives" className="text-xl font-semibold sm:text-2xl">
              {tool.name} alternatives
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {alternatives.map((alternative) => (
                <ToolCard key={alternative.id} tool={alternative} sourceType="tool" />
              ))}
            </div>
            <Link
              href={`/alternatives/${tool.slug}`}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Explore Alternatives
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </section>
        ) : null}

        {comparisons.length > 0 ? (
          <section aria-labelledby="related-comparisons" className="mt-16">
            <h2 id="related-comparisons" className="text-xl font-semibold sm:text-2xl">
              Related comparisons
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {comparisons.map((comparison) => (
                <li key={comparison.slug}>
                  <Link
                    href={`/compare/${comparison.slug}`}
                    className="flex items-center justify-between gap-4 rounded-card border border-border bg-card px-5 py-4 text-sm font-medium transition-colors hover:border-border-strong hover:bg-card-hover"
                  >
                    {comparison.title}
                    <ArrowUpRight className="size-4 shrink-0 text-subtle" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {relatedGuides.length > 0 ? (
          <section aria-labelledby="related-guides" className="mt-16">
            <h2 id="related-guides" className="text-xl font-semibold sm:text-2xl">
              Related guides
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {relatedGuides.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>

      <JsonLd
        data={[
          breadcrumbSchema(breadcrumbs),
          softwareApplicationSchema(tool),
          ...(faq ? [faq] : []),
        ]}
      />
    </>
  );
}
