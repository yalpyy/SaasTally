import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";
import { EmptyState } from "@/components/ui/empty-state";
import { getReviews } from "@/services/reviews";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = buildMetadata({
  title: "Software reviews",
  description:
    "Independent, criteria-led software reviews with scored breakdowns for features, ease of use, value and support.",
  path: "/reviews",
});

export default async function ReviewsPage() {
  const reviews = await getReviews();
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Reviews", href: "/reviews" },
  ];

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Scored against the same four criteria every time: features, ease of use, value and support."
        breadcrumbs={breadcrumbs}
      />

      <Container className="py-12 sm:py-16">
        {reviews.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {reviews.map((review) => (
              <li key={review.id}>
                <Card interactive className="relative h-full p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-lg font-semibold">
                      <Link href={`/reviews/${review.slug}`} className="after:absolute after:inset-0">
                        {review.title}
                      </Link>
                    </h2>
                    <Rating value={review.score} size="md" />
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                    {review.quickVerdict}
                  </p>
                  <p className="mt-5 flex items-center gap-2 text-xs text-subtle">
                    Updated {formatDate(review.updatedAt)}
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No reviews published yet" description="Editorial reviews are on the way." />
        )}
      </Container>

      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
    </>
  );
}
