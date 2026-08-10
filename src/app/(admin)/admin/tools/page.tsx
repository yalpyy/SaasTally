import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/auth";
import { getTools } from "@/services/tools";
import { dataMode } from "@/lib/supabase/config";
import { formatDate } from "@/lib/utils/format";
import type { Tool } from "@/types";

export const metadata = { title: "Tools" };

export default async function AdminToolsPage() {
  const profile = await requireStaff();
  const tools = await getTools();
  const live = dataMode() === "live";

  const columns: Column<Tool>[] = [
    {
      key: "name",
      header: "Name",
      render: (tool) => (
        <span className="flex flex-col">
          <Link href={`/tools/${tool.slug}`} className="font-medium hover:underline">
            {tool.name}
          </Link>
          <span className="text-xs text-subtle">/{tool.slug}</span>
        </span>
      ),
    },
    {
      key: "categories",
      header: "Categories",
      render: (tool) => (
        <span className="text-muted">{tool.categorySlugs.join(", ") || "—"}</span>
      ),
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
          {tool.sponsored ? <Badge tone="outline">Affiliate</Badge> : null}
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
  ];

  return (
    <>
      <AdminHeader profile={profile} title="Tools" />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {tools.length} tool{tools.length === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            disabled={!live}
            title={live ? undefined : "Connect Supabase to create records"}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden="true" />
            New tool
          </button>
        </div>

        <DataTable
          rows={tools}
          columns={columns}
          emptyTitle="No tools yet"
          emptyDescription="Create your first tool record to start building the catalogue."
        />
      </div>
    </>
  );
}
