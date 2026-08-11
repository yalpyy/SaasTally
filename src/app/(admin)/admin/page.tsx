import Link from "next/link";
import { FileText, GitCompareArrows, MousePointerClick, Package } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { StatCard } from "@/components/admin/stat-card";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/auth";
import { getTools } from "@/services/tools";
import { getArticles } from "@/services/articles";
import { getComparisons } from "@/services/comparisons";
import { dataMode } from "@/lib/supabase/config";

export default async function AdminDashboardPage() {
  const profile = await requireStaff();
  const [tools, articles, comparisons] = await Promise.all([
    getTools(),
    getArticles(),
    getComparisons(),
  ]);

  const mode = dataMode();
  const sponsored = tools.filter((tool) => tool.sponsored);

  return (
    <>
      <AdminHeader profile={profile} title="Dashboard" />

      <div className="space-y-8 p-5 sm:p-8">
        <ModeBanner />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total tools" value={tools.length} Icon={Package} hint="Active and visible" />
          <StatCard
            label="Published articles"
            value={articles.length}
            Icon={FileText}
            hint="Live on the site"
          />
          <StatCard
            label="Affiliate clicks"
            value={mode === "live" ? "—" : "n/a"}
            Icon={MousePointerClick}
            hint={
              mode === "live"
                ? "Connect analytics reads to populate"
                : "Requires a live database"
            }
          />
          <StatCard
            label="Comparisons"
            value={comparisons.length}
            Icon={GitCompareArrows}
            hint="Published"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold">Top clicked tools</h2>
              <Link href="/admin/affiliate" className="text-xs text-muted hover:text-foreground">
                Affiliate programs
              </Link>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {mode === "live"
                ? "Click aggregation reads from the affiliate_clicks table. No rows have been recorded yet."
                : "Click data is only available with a live database. Nothing is being recorded in mock mode."}
            </p>
            <ul className="mt-5 space-y-2">
              {sponsored.map((tool) => (
                <li
                  key={tool.id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm"
                >
                  <span>{tool.name}</span>
                  <span className="text-xs text-subtle">Program active</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold">Recently updated content</h2>
            <ul className="mt-4 space-y-2">
              {articles.slice(0, 5).map((article) => (
                <li
                  key={article.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-2.5 text-sm"
                >
                  <span className="truncate">{article.title}</span>
                  <span className="shrink-0 text-xs capitalize text-subtle">{article.status}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
