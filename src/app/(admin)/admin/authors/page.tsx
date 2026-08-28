import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { AdminListToolbar, EditCell } from "@/components/admin/admin-list-toolbar";
import { requireStaff } from "@/lib/auth";
import { listAuthorsForAdmin, type AdminAuthorRow } from "@/services/admin-content";
import { dataMode } from "@/lib/supabase/config";

export const metadata = { title: "Authors" };

export default async function AdminAuthorsPage() {
  const profile = await requireStaff();
  const live = dataMode() === "live";
  const authors: AdminAuthorRow[] = live ? ((await listAuthorsForAdmin()) ?? []) : [];

  const columns: Column<AdminAuthorRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (author) => (
        <span className="flex flex-col">
          <span className="font-medium">{author.name}</span>
          <span className="text-xs text-subtle">/{author.slug}</span>
        </span>
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (author) => <span className="text-muted">{author.title || "—"}</span>,
    },
    {
      key: "bio",
      header: "Bio",
      render: (author) => (
        <span className="text-xs text-subtle">{author.bio ? "Written" : "Missing"}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (author) => <EditCell href={`/admin/authors/${author.id}/edit`} live={live} />,
    },
  ];

  return (
    <>
      <AdminHeader profile={profile} title="Authors" />
      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <AdminListToolbar
          count={authors.length}
          noun="author"
          createHref="/admin/authors/new"
          live={live}
        />

        <DataTable
          rows={authors}
          columns={columns}
          emptyTitle="No authors yet"
          emptyDescription="Reviews fall back to the house byline until an author is created."
        />
      </div>
    </>
  );
}
