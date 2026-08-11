import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/auth";
import { getReviews } from "@/services/reviews";
import { formatDate } from "@/lib/utils/format";
import type { Review } from "@/types";

export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  const profile = await requireStaff();
  const reviews = await getReviews();

  const columns: Column<Review>[] = [
    {
      key: "title",
      header: "Title",
      render: (review) => (
        <Link href={`/reviews/${review.slug}`} className="font-medium hover:underline">
          {review.title}
        </Link>
      ),
    },
    { key: "tool", header: "Tool", render: (review) => <span className="text-muted">{review.toolSlug}</span> },
    {
      key: "score",
      header: "Score",
      render: (review) => <span className="tabular-nums">{review.score.toFixed(1)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (review) => <Badge tone={review.status === "published" ? "primary" : "outline"}>{review.status}</Badge>,
    },
    {
      key: "updated",
      header: "Updated",
      render: (review) => <span className="text-xs text-subtle">{formatDate(review.updatedAt)}</span>,
    },
  ];

  return (
    <>
      <AdminHeader profile={profile} title="Reviews" />
      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />
        <DataTable rows={reviews} columns={columns} emptyTitle="No reviews yet" />
      </div>
    </>
  );
}
