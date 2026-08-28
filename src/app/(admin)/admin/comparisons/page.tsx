import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { AdminListToolbar, EditCell } from "@/components/admin/admin-list-toolbar";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/auth";
import { getComparisons } from "@/services/comparisons";
import { listComparisonsForAdmin, type AdminComparisonRow } from "@/services/admin-content";
import { dataMode } from "@/lib/supabase/config";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Comparisons" };

export default async function AdminComparisonsPage() {
  const profile = await requireStaff();
  const live = dataMode() === "live";

  const comparisons: AdminComparisonRow[] = live
    ? ((await listComparisonsForAdmin()) ?? [])
    : (await getComparisons()).map((comparison) => ({
        id: comparison.id,
        title: comparison.title,
        slug: comparison.slug,
        toolAId: "",
        toolBId: "",
        toolAName: comparison.toolSlugs[0],
        toolBName: comparison.toolSlugs[1],
        quickVerdict: comparison.quickVerdict,
        recommendation: comparison.recommendation,
        attributes: "",
        rowCount: comparison.attributes.length,
        status: comparison.status,
        publishedAt: "",
        updatedAt: comparison.updatedAt,
      }));

  const columns: Column<AdminComparisonRow>[] = [
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
      render: (comparison) => (
        <span className="text-muted">
          {comparison.toolAName} vs {comparison.toolBName}
        </span>
      ),
    },
    {
      key: "criteria",
      header: "Criteria",
      render: (comparison) => <span className="tabular-nums">{comparison.rowCount}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (comparison) => (
        <Badge tone={comparison.status === "published" ? "primary" : "outline"}>
          {comparison.status}
        </Badge>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      render: (comparison) => (
        <span className="text-xs text-subtle">{formatDate(comparison.updatedAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (comparison) => (
        <EditCell href={`/admin/comparisons/${comparison.id}/edit`} live={live} />
      ),
    },
  ];

  return (
    <>
      <AdminHeader profile={profile} title="Comparisons" />
      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <AdminListToolbar
          count={comparisons.length}
          noun="comparison"
          createHref="/admin/comparisons/new"
          live={live}
        />

        <DataTable rows={comparisons} columns={columns} emptyTitle="No comparisons yet" />
      </div>
    </>
  );
}
