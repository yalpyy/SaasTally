import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/auth";
import { dataMode } from "@/lib/supabase/config";
import { siteConfig } from "@/lib/site";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  // Sensitive site configuration is admin-only.
  const profile = await requireStaff("admin");
  const mode = dataMode();

  const rows = [
    { label: "Site name", value: siteConfig.name },
    { label: "Site URL", value: siteConfig.url },
    { label: "Data source", value: mode === "live" ? "Supabase (live)" : "Development fixtures" },
    { label: "Signed in as", value: profile.email ?? profile.id },
    { label: "Role", value: profile.role },
  ];

  return (
    <>
      <AdminHeader profile={profile} title="Settings" />
      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <Card className="p-6">
          <h2 className="text-sm font-semibold">Environment</h2>
          <dl className="mt-4 divide-y divide-border">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 py-3 text-sm">
                <dt className="text-muted">{row.label}</dt>
                <dd className="text-right font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="p-6 text-sm leading-relaxed text-muted">
          <p className="font-medium text-foreground">Editable settings</p>
          <p className="mt-2">
            Site-wide settings live in the <code className="text-xs">site_settings</code> table so
            they can be changed without a deploy. The write UI ships once Supabase credentials are
            configured — nothing here pretends to save while running on fixtures.
          </p>
        </Card>
      </div>
    </>
  );
}
