import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/auth";
import { affiliatePrograms } from "@/data/affiliate-programs";
import { listProgramsForAdmin, type AdminProgramRow } from "@/services/admin-affiliate";
import { dataMode } from "@/lib/supabase/config";

export const metadata = { title: "Affiliate" };

export default async function AdminAffiliatePage() {
  // Affiliate configuration is admin-only; editors never see commercial terms.
  const profile = await requireStaff("admin");
  const live = dataMode() === "live";

  // In live mode read through the admin service, which goes via the session
  // client so RLS re-checks the admin role. In mock mode show the fixtures so
  // the screen can still be worked on without a database.
  const programs: AdminProgramRow[] = live
    ? ((await listProgramsForAdmin()) ?? [])
    : affiliatePrograms.map((program) => ({
        id: program.id,
        toolId: program.id,
        toolName: program.toolSlug,
        toolSlug: program.toolSlug,
        network: program.network,
        programName: program.programName,
        affiliateUrl: program.affiliateUrl,
        commissionType: program.commissionType,
        commissionValue: program.commissionValue,
        cookieDays: program.cookieDays,
        status: program.status,
        updatedAt: new Date(0).toISOString(),
      }));

  const columns: Column<AdminProgramRow>[] = [
    {
      key: "tool",
      header: "Tool",
      render: (program) => (
        <span className="flex flex-col">
          <span className="font-medium">{program.toolName}</span>
          <span className="text-xs text-subtle">/{program.toolSlug}</span>
        </span>
      ),
    },
    {
      key: "network",
      header: "Network",
      render: (program) => <span className="text-muted">{program.network || "—"}</span>,
    },
    {
      key: "program",
      header: "Program",
      render: (program) => <span className="text-muted">{program.programName || "—"}</span>,
    },
    {
      key: "commission",
      header: "Commission",
      render: (program) => (
        <span className="text-muted">
          {program.commissionValue || "—"}
          {program.commissionType ? ` (${program.commissionType})` : ""}
        </span>
      ),
    },
    {
      key: "cookie",
      header: "Cookie",
      render: (program) => (
        <span className="tabular-nums">
          {program.cookieDays === null ? "—" : `${program.cookieDays}d`}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (program) => (
        <Badge tone={program.status === "active" ? "primary" : "outline"}>{program.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (program) =>
        live ? (
          <Link
            href={`/admin/affiliate/${program.id}/edit`}
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
      <AdminHeader profile={profile} title="Affiliate programs" />
      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <Card className="p-5 text-sm leading-relaxed text-muted">
          <p className="font-medium text-foreground">Editorial firewall</p>
          <p className="mt-2">
            Commission values are stored in <code className="text-xs">affiliate_programs</code> and
            are never read by ranking, scoring or sorting code. Public pages only ever see whether a
            program is active, so a tool can be labelled an affiliate partner without gaining
            position.
          </p>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {programs.length} program{programs.length === 1 ? "" : "s"}
            {live ? null : " (fixtures)"}
          </p>

          {live ? (
            <Link
              href="/admin/affiliate/new"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <Plus className="size-4" aria-hidden="true" />
              New program
            </Link>
          ) : (
            <span
              title="Connect Supabase to create records"
              className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              New program
            </span>
          )}
        </div>

        <DataTable
          rows={programs}
          columns={columns}
          emptyTitle={live ? "No affiliate programs yet" : "No programs configured"}
          emptyDescription="Add a program to enable the /go redirect for a tool."
        />
      </div>
    </>
  );
}
