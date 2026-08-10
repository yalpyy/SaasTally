import { absoluteUrl, siteConfig } from "@/lib/site";
import type { Article, Comparison, Review, Tool, ToolFaq } from "@/types";

/**
 * Renders JSON-LD. We only ever emit nodes for data that actually exists —
 * fabricated aggregateRating values are both dishonest and a policy risk.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // Content is generated from our own typed data, never from user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    slogan: siteConfig.tagline,
    description: siteConfig.description,
  };
}

export function websiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(items: { label: string; href: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  };
}

export function softwareApplicationSchema(tool: Tool): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.shortDescription || tool.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: tool.websiteUrl,
  };

  if (tool.startingPrice) {
    schema.offers = {
      "@type": "Offer",
      priceCurrency: "USD",
      description: tool.startingPrice,
      url: absoluteUrl(`/tools/${tool.slug}`),
    };
  }

  return schema;
}

export function reviewSchema(review: Review, tool: Tool): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    name: review.title,
    reviewBody: review.quickVerdict,
    datePublished: review.publishedAt,
    author: { "@type": "Organization", name: siteConfig.name },
    publisher: { "@type": "Organization", name: siteConfig.name },
    itemReviewed: {
      "@type": "SoftwareApplication",
      name: tool.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: tool.websiteUrl,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.score,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

export function articleSchema(article: Article): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: absoluteUrl(`/articles/${article.slug}`),
    author: { "@type": "Organization", name: siteConfig.name },
    publisher: { "@type": "Organization", name: siteConfig.name },
  };
}

export function comparisonSchema(comparison: Comparison): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: comparison.title,
    description: comparison.quickVerdict,
    datePublished: comparison.publishedAt,
    dateModified: comparison.updatedAt,
    mainEntityOfPage: absoluteUrl(`/compare/${comparison.slug}`),
    author: { "@type": "Organization", name: siteConfig.name },
    publisher: { "@type": "Organization", name: siteConfig.name },
  };
}

/** Only emit when there is at least one real question/answer pair. */
export function faqSchema(faqs: ToolFaq[]): Record<string, unknown> | null {
  if (faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
