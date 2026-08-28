import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { AdminListToolbar, EditCell } from "@/components/admin/admin-list-toolbar";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/auth";
import { getReviews } from "@/services/reviews";
import { listReviewsForAdmin, type AdminReviewRow } from "@/services/admin-content";
import { dataMode } from "@/lib/supabase/config";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  const profile = await requireStaff();
  const live = dataMode() === "live";

  // In live mode read through the admin service so drafts are listed too. In
  // mock mode fall back to the public service, which reads the fixtures.
  const reviews: AdminReviewRow[] = live
    ? ((await listReviewsForAdmin()) ?? [])
    : (await getReviews()).map((review) => ({
        id: review.id,
        toolId: "",
        toolName: review.toolSlug,
        title: review.title,
        slug: review.slug,
        quickVerdict: review.quickVerdict,
        score: String(review.score),
        breakdown: "",
        likes: "",
        improvements: "",
        featuresBody: "",
        pricingBody: "",
        experienceBody: "",
        audienceBody: "",
        finalVerdict: "",
        authorId: "",
        authorName: review.authorName,
        status: review.status,
        publishedAt: review.publishedAt,
        updatedAt: review.updatedAt,
      }));

  const columns: Column<AdminReviewRow>[] = [
    {
      key: "title",
      header: "Title",
      render: (review) => (
        <Link href={`/reviews/${review.slug}`} className="font-medium hover:underline">
          {review.title}
        </Link>
      ),
    },
    {
      key: "tool",
      header: "Tool",
      render: (review) => <span className="text-muted">{review.toolName}</span>,
    },
    {
      key: "author",
      header: "Author",
      render: (review) => <span className="text-muted">{review.authorName}</span>,
    },
    {
      key: "score",
      header: "Score",
      render: (review) => (
        <span className="tabular-nums">{review.score ? `${review.score} / 10` : "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (review) => (
        <Badge tone={review.status === "published" ? "primary" : "outline"}>{review.status}</Badge>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      render: (review) => <span className="text-xs text-subtle">{formatDate(review.updatedAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (review) => <EditCell href={`/admin/reviews/${review.id}/edit`} live={live} />,
    },
  ];

  return (
    <>
      <AdminHeader profile={profile} title="Reviews" />
      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <AdminListToolbar
          count={reviews.length}
          noun="review"
          createHref="/admin/reviews/new"
          live={live}
        />

        <DataTable rows={reviews} columns={columns} emptyTitle="No reviews yet" />
      </div>
    </>
  );
}
