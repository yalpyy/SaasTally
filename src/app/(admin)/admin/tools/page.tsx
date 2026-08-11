import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/auth";
import { getTools } from "@/services/tools";
import { listToolsForAdmin, type AdminToolRow } from "@/services/admin-tools";
import { dataMode } from "@/lib/supabase/config";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Tools" };

export default async function AdminToolsPage() {
  const profile = await requireStaff();
  const live = dataMode() === "live";

  // In live mode read through the admin service so hidden tools are listed too.
  // In mock mode fall back to the public service, which reads the fixtures.
  const rows: AdminToolRow[] = live
    ? ((await listToolsForAdmin()) ?? [])
    : (await getTools()).map((tool) => ({
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        rating: tool.rating,
        startingPrice: tool.startingPrice,
        featured: tool.featured,
        active: tool.active,
        categorySlugs: tool.categorySlugs,
        updatedAt: tool.updatedAt,
      }));

  const columns: Column<AdminToolRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (tool) => (
        <span className="flex flex-col">
          <span className="font-medium">{tool.name}</span>
          <span className="text-xs text-subtle">/{tool.slug}</span>
        </span>
      ),
    },
    {
      key: "categories",
      header: "Categories",
      render: (tool) => <span className="text-muted">{tool.categorySlugs.join(", ") || "—"}</span>,
    },
    {
      key: "rating",
      header: "Rating",
      render: (tool) => (
        <span className="tabular-nums">{tool.rating !== null ? tool.rating.toFixed(1) : "—"}</span>
      ),
    },
    {
      key: "price",
      header: "Starting price",
      render: (tool) => <span className="text-muted">{tool.startingPrice ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (tool) => (
        <span className="flex flex-wrap justify-end gap-1.5 md:justify-start">
          {tool.featured ? <Badge tone="primary">Featured</Badge> : null}
          <Badge tone={tool.active ? "neutral" : "warning"}>
            {tool.active ? "Active" : "Hidden"}
          </Badge>
        </span>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      render: (tool) => <span className="text-xs text-subtle">{formatDate(tool.updatedAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (tool) =>
        live ? (
          <Link
            href={`/admin/tools/${tool.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-card-hover"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit
          </Link>
        ) : (
          <span className="text-xs text-subtle">Read-only</span>
        ),
    },
  ];

  return (
    <>
      <AdminHeader profile={profile} title="Tools" />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {rows.length} tool{rows.length === 1 ? "" : "s"}
          </p>

          {live ? (
            <Link
              href="/admin/tools/new"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <Plus className="size-4" aria-hidden="true" />
              New tool
            </Link>
          ) : (
            <span
              title="Connect Supabase to create records"
              className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              New tool
            </span>
          )}
        </div>

        <DataTable
          rows={rows}
          columns={columns}
          emptyTitle="No tools yet"
          emptyDescription="Create your first tool record to start building the catalogue."
        />
      </div>
    </>
  );
}
