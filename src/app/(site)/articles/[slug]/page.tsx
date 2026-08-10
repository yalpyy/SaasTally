import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArticleCard } from "@/components/articles/article-card";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { Markdown } from "@/lib/utils/markdown";
import { getArticleBySlug, getArticleSlugs, getArticles } from "@/services/articles";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, articleSchema, breadcrumbSchema } from "@/lib/seo/jsonld";
import { formatDate } from "@/lib/utils/format";

export async function generateStaticParams() {
  const slugs = await getArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return buildMetadata({
      title: "Guide not found",
      description: "This guide does not exist.",
      path: `/articles/${slug}`,
      noIndex: true,
    });
  }

  const metadata = buildMetadata({
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.excerpt,
    path: `/articles/${article.slug}`,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
  });

  // Editor-supplied canonical wins (used for syndicated or consolidated posts).
  if (article.canonicalUrl) {
    metadata.alternates = { canonical: article.canonicalUrl };
  }

  return metadata;
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const related = (await getArticles())
    .filter((item) => item.slug !== article.slug && item.categorySlug === article.categorySlug)
    .slice(0, 3);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Guides", href: "/articles" },
    { label: article.title, href: `/articles/${article.slug}` },
  ];

  return (
    <>
      <Container size="narrow" className="py-12 sm:py-16">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        <article>
          <header>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-[42px] md:leading-[1.12]">
              {article.title}
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-muted">{article.excerpt}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3 border-b border-border pb-6 text-sm text-subtle">
              <span>{article.authorName}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden="true" />
                {article.readingMinutes} min read
              </span>
            </div>
          </header>

          <div className="mt-8">
            <Markdown content={article.content} />
          </div>
        </article>

        <AffiliateDisclosure variant="panel" className="mt-10" />
      </Container>

      {related.length > 0 ? (
        <Container className="pb-16 sm:pb-20">
          <h2 className="text-xl font-semibold sm:text-2xl">Related guides</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ArticleCard key={item.id} article={item} />
            ))}
          </div>
        </Container>
      ) : null}

      <JsonLd data={[breadcrumbSchema(breadcrumbs), articleSchema(article)]} />
    </>
  );
}
