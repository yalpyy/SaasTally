import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { ReviewForm } from "@/components/admin/review-form";
import { requireStaff } from "@/lib/auth";
import { listToolOptions } from "@/services/admin-affiliate";
import { getReviewForEdit, listAuthorOptions } from "@/services/admin-content";

export const metadata = { title: "Edit review" };

export default async function EditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireStaff();
  const { id } = await params;

  const [review, tools, authors] = await Promise.all([
    getReviewForEdit(id),
    listToolOptions(),
    listAuthorOptions(),
  ]);
  if (!review) notFound();

  return (
    <>
      <AdminHeader profile={profile} title={`Edit ${review.title}`} />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/reviews"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to reviews
          </Link>

          <Link
            href={`/reviews/${review.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            View public page
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="max-w-3xl">
          <ReviewForm
            tools={tools}
            authors={authors}
            review={{
              id: review.id,
              toolId: review.toolId,
              title: review.title,
              slug: review.slug,
              quickVerdict: review.quickVerdict,
              score: review.score,
              breakdown: review.breakdown,
              likes: review.likes,
              improvements: review.improvements,
              featuresBody: review.featuresBody,
              pricingBody: review.pricingBody,
              experienceBody: review.experienceBody,
              audienceBody: review.audienceBody,
              finalVerdict: review.finalVerdict,
              authorId: review.authorId,
              status: review.status,
              publishedAt: review.publishedAt,
            }}
          />
        </div>
      </div>
    </>
  );
}
