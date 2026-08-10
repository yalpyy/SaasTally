import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/auth";
import { affiliatePrograms } from "@/data/affiliate-programs";
import { dataMode } from "@/lib/supabase/config";
import type { AffiliateProgram } from "@/types";

export const metadata = { title: "Affiliate" };

export default async function AdminAffiliatePage() {
  // Affiliate configuration is admin-only; editors never see commercial terms.
  const profile = await requireStaff("admin");
  const live = dataMode() === "live";
  const programs = live ? [] : affiliatePrograms;

  const columns: Column<AffiliateProgram>[] = [
    { key: "tool", header: "Tool", render: (program) => <span className="font-medium">{program.toolSlug}</span> },
    { key: "network", header: "Network", render: (program) => <span className="text-muted">{program.network}</span> },
    {
      key: "program",
      header: "Program",
      render: (program) => <span className="text-muted">{program.programName}</span>,
    },
    {
      key: "commission",
      header: "Commission",
      render: (program) => (
        <span className="text-muted">
          {program.commissionValue || "—"} ({program.commissionType})
        </span>
      ),
    },
    {
      key: "cookie",
      header: "Cookie",
      render: (program) => <span className="tabular-nums">{program.cookieDays}d</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (program) => (
        <Badge tone={program.status === "active" ? "primary" : "outline"}>{program.status}</Badge>
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
