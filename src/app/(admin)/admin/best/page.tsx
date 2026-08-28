import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { AdminListToolbar, EditCell } from "@/components/admin/admin-list-toolbar";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/auth";
import { getBestLists } from "@/services/best-lists";
import { listBestListsForAdmin, type AdminBestListRow } from "@/services/admin-content";
import { dataMode } from "@/lib/supabase/config";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Best lists" };

export default async function AdminBestListsPage() {
  const profile = await requireStaff();
  const live = dataMode() === "live";

  const lists: AdminBestListRow[] = live
    ? ((await listBestListsForAdmin()) ?? [])
    : (await getBestLists()).map((list) => ({
        id: list.slug,
        title: list.title,
        slug: list.slug,
        description: list.description,
        intro: "",
        categoryId: "",
        categoryName: list.categorySlug,
        entries: list.items.map((item) => item.toolSlug).join("\n"),
        toolCount: list.items.length,
        status: list.status,
        publishedAt: "",
        updatedAt: list.updatedAt,
      }));

  const columns: Column<AdminBestListRow>[] = [
    {
      key: "title",
      header: "Title",
      render: (list) => (
        <Link href={`/best/${list.slug}`} className="font-medium hover:underline">
          {list.title}
        </Link>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (list) => <span className="text-muted">{list.categoryName || "—"}</span>,
    },
    {
      key: "tools",
      header: "Tools",
      render: (list) => <span className="tabular-nums">{list.toolCount}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (list) => (
        <Badge tone={list.status === "published" ? "primary" : "outline"}>{list.status}</Badge>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      render: (list) => <span className="text-xs text-subtle">{formatDate(list.updatedAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (list) => <EditCell href={`/admin/best/${list.id}/edit`} live={live} />,
    },
  ];

  return (
    <>
      <AdminHeader profile={profile} title="Best lists" />
      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <AdminListToolbar
          count={lists.length}
          noun="list"
          createHref="/admin/best/new"
          live={live}
        />

        <DataTable
          rows={lists}
          columns={columns}
          emptyTitle="No shortlists yet"
          emptyDescription="A list is published once there are enough tools we can defend recommending."
        />
      </div>
    </>
  );
}
