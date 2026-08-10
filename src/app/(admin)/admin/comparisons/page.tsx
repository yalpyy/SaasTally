import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/auth";
import { getComparisons } from "@/services/comparisons";
import { formatDate } from "@/lib/utils/format";
import type { Comparison } from "@/types";

export const metadata = { title: "Comparisons" };

export default async function AdminComparisonsPage() {
  const profile = await requireStaff();
  const comparisons = await getComparisons();

  const columns: Column<Comparison>[] = [
    {
      key: "title",
      header: "Title",
      render: (comparison) => (
        <Link href={`/compare/${comparison.slug}`} className="font-medium hover:underline">
          {comparison.title}
        </Link>
      ),
    },
    {
      key: "tools",
      header: "Tools",
      render: (comparison) => <span className="text-muted">{comparison.toolSlugs.join(" vs ")}</span>,
    },
    {
      key: "criteria",
      header: "Criteria",
      render: (comparison) => <span className="tabular-nums">{comparison.attributes.length}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (comparison) => (
        <Badge tone={comparison.status === "published" ? "primary" : "outline"}>{comparison.status}</Badge>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      render: (comparison) => <span className="text-xs text-subtle">{formatDate(comparison.updatedAt)}</span>,
    },
  ];

  return (
    <>
      <AdminHeader profile={profile} title="Comparisons" />
      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />
        <DataTable rows={comparisons} columns={columns} emptyTitle="No comparisons yet" />
      </div>
    </>
  );
}
