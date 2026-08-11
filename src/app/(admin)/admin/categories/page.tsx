import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/auth";
import { getCategories } from "@/services/categories";
import type { Category } from "@/types";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const profile = await requireStaff();
  const categories = await getCategories();

  const columns: Column<Category>[] = [
    {
      key: "name",
      header: "Name",
      render: (category) => (
        <span className="flex flex-col">
          <span className="font-medium">{category.name}</span>
          <span className="text-xs text-subtle">/{category.slug}</span>
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (category) => <span className="text-muted">{category.description}</span>,
    },
    { key: "icon", header: "Icon key", render: (category) => <code className="text-xs">{category.icon}</code> },
    {
      key: "tools",
      header: "Tools",
      render: (category) => <span className="tabular-nums">{category.toolCount ?? 0}</span>,
    },
    {
      key: "featured",
      header: "Featured",
      render: (category) =>
        category.featured ? <Badge tone="primary">Featured</Badge> : <span className="text-subtle">—</span>,
    },
  ];

  return (
    <>
      <AdminHeader profile={profile} title="Categories" />
      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />
        <DataTable
          rows={categories}
          columns={columns}
          emptyTitle="No categories yet"
          emptyDescription="Categories drive navigation, filtering and the homepage grid."
        />
      </div>
    </>
  );
}
