import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";
import { RatingBreakdown } from "@/components/ui/rating-breakdown";
import { ProsCons } from "@/components/ui/pros-cons";
import { ToolLogo } from "@/components/ui/tool-logo";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { ToolCard } from "@/components/tools/tool-card";
import { getReviewBySlug, getReviewSlugs } from "@/services/reviews";
import { getToolBySlug, getToolsBySlugs } from "@/services/tools";
import { affiliateHref, affiliateLinkAttributes } from "@/lib/affiliate/links";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema, reviewSchema } from "@/lib/seo/jsonld";
import { formatDate } from "@/lib/utils/format";

export async function generateStaticParams() {
  const slugs = await getReviewSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);

  if (!review) {
    return buildMetadata({
      title: "Review not found",
      description: "This review does not exist.",
      path: `/reviews/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: review.title,
    description: review.quickVerdict,
    path: `/reviews/${review.slug}`,
    type: "article",
    publishedTime: review.publishedAt,
    modifiedTime: review.updatedAt,
  });
}

export default async function ReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  if (!review) notFound();

  const tool = await getToolBySlug(review.toolSlug);
  if (!tool) notFound();

  const alternatives = await getToolsBySlugs(tool.alternativeSlugs);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Reviews", href: "/reviews" },
    { label: review.title, href: `/reviews/${review.slug}` },
  ];

  const ctaHref = tool.sponsored
    ? affiliateHref(tool.slug, { sourceType: "review", source: `/reviews/${review.slug}`, position: "review" })
    : tool.websiteUrl;

  const sections = [
    { id: "features", title: "Features", body: review.featuresBody },
    { id: "pricing", title: "Pricing", body: review.pricingBody },
    { id: "experience", title: "User experience", body: review.experienceBody },
    { id: "audience", title: "Who should use it", body: review.audienceBody },
  ];

  return (
    <>
      <div className="border-b border-border bg-elevated/50 py-10 sm:py-14">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <div className="flex flex-wrap items-center gap-4">
            <ToolLogo name={tool.name} src={tool.logoUrl} size={56} className="rounded-2xl" />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{review.title}</h1>
              <p className="mt-2 text-sm text-subtle">
                By {review.authorName} · Updated {formatDate(review.updatedAt)}
              </p>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article className="min-w-0 space-y-14">
            <section aria-labelledby="quick-verdict">
              <h2 id="quick-verdict" className="text-xl font-semibold sm:text-2xl">
                Quick verdict
              </h2>
              <Card className="mt-4 border-l-2 border-l-primary p-6">
                <p className="text-[15px] leading-relaxed">{review.quickVerdict}</p>
                <p className="mt-4 flex items-center gap-2 text-sm text-subtle">
                  Overall
                  <Rating value={review.score} size="md" className="text-foreground" />
                </p>
              </Card>
              <AffiliateDisclosure variant="panel" className="mt-6" />
            </section>

            <section aria-labelledby="breakdown">
              <h2 id="breakdown" className="text-xl font-semibold sm:text-2xl">
                Rating breakdown
              </h2>
              <RatingBreakdown criteria={review.breakdown} className="mt-5" />
            </section>

            <section aria-labelledby="likes">
              <h2 id="likes" className="mb-5 text-xl font-semibold sm:text-2xl">
                What we like, what could be better
              </h2>
              <ProsCons pros={review.likes} cons={review.improvements} />
            </section>

            {sections.map((section) => (
              <section key={section.id} aria-labelledby={section.id}>
                <h2 id={section.id} className="text-xl font-semibold sm:text-2xl">
                  {section.title}
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">{section.body}</p>
              </section>
            ))}

            <section aria-labelledby="final-verdict">
              <h2 id="final-verdict" className="text-xl font-semibold sm:text-2xl">
                Final verdict
              </h2>
              <Card className="mt-4 p-6">
                <p className="text-[15px] leading-relaxed">{review.finalVerdict}</p>
              </Card>
            </section>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <ToolLogo name={tool.name} src={tool.logoUrl} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{tool.name}</p>
                  <p className="truncate text-xs text-subtle">{tool.shortDescription}</p>
                </div>
              </div>
              <a
                href={ctaHref}
                {...affiliateLinkAttributes}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Visit Website
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
              <Link
                href={`/tools/${tool.slug}`}
                className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-medium transition-colors hover:bg-card-hover"
              >
                See full profile
              </Link>
            </Card>
          </aside>
        </div>

        {alternatives.length > 0 ? (
          <section aria-labelledby="review-alternatives" className="mt-16">
            <h2 id="review-alternatives" className="text-xl font-semibold sm:text-2xl">
              Alternatives
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {alternatives.map((alternative) => (
                <ToolCard key={alternative.id} tool={alternative} sourceType="review" />
              ))}
            </div>
          </section>
        ) : null}
      </Container>

      <JsonLd data={[breadcrumbSchema(breadcrumbs), reviewSchema(review, tool)]} />
    </>
  );
}
