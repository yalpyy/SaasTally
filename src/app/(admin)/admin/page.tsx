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
import { getClickStats } from "@/services/affiliate-stats";
import { dataMode } from "@/lib/supabase/config";

export default async function AdminDashboardPage() {
  const profile = await requireStaff();
  const [tools, articles, comparisons, clickStats] = await Promise.all([
    getTools(),
    getArticles(),
    getComparisons(),
    getClickStats(30),
  ]);

  const mode = dataMode();
  const sponsored = tools.filter((tool) => tool.sponsored);

  // Three distinct states, deliberately not collapsed into one: mock mode
  // records nothing, live mode without a secret key cannot read the table, and
  // live mode with credentials returns a real number — including a real zero.
  const clickValue = mode !== "live" ? "n/a" : clickStats ? clickStats.total : "—";

  const clickHint =
    mode !== "live"
      ? "Requires a live database"
      : clickStats
        ? `Last ${clickStats.windowDays} days`
        : "Set SUPABASE_SECRET_KEY to read click data";

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
            value={clickValue}
            Icon={MousePointerClick}
            hint={clickHint}
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

            {clickStats && clickStats.topTools.length > 0 ? (
              <>
                <p className="mt-4 text-xs text-subtle">
                  Outbound CTA clicks over the last {clickStats.windowDays} days.
                </p>
                <ul className="mt-4 space-y-2">
                  {clickStats.topTools.map((tool) => (
                    <li
                      key={tool.slug}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-2.5 text-sm"
                    >
                      <span className="truncate">{tool.name}</span>
                      <span className="shrink-0 tabular-nums text-xs text-subtle">
                        {tool.clicks}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  {mode !== "live"
                    ? "Click data is only available with a live database. Nothing is being recorded in mock mode."
                    : clickStats
                      ? "No clicks recorded in the last 30 days. Tools with an active affiliate program appear here once visitors use a CTA."
                      : "Click aggregation needs SUPABASE_SECRET_KEY. Clicks are still being recorded — they just cannot be read here yet."}
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
              </>
            )}
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
