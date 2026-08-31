import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { AdminListToolbar, EditCell } from "@/components/admin/admin-list-toolbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/auth";
import { getQueueSummary, listSourcesForAdmin, type AdminSourceRow } from "@/services/admin-ingest";
import { dataMode } from "@/lib/supabase/config";
import { formatDate } from "@/lib/utils/format";
import { RunIngestButton } from "@/components/admin/run-ingest-button";

export const metadata = { title: "Sources" };

// The manual run fetches vendor pages inline, so the route needs longer than
// the default. 60 is the ceiling on Vercel's smaller plans.
export const maxDuration = 60;

/** A fetch that has never run, versus one that ran and found nothing new. */
function fetchLabel(source: AdminSourceRow): { text: string; tone: "primary" | "outline" | "warning" } {
  if (source.lastError) return { text: "Error", tone: "warning" };
  if (!source.lastFetchedAt) return { text: "Never fetched", tone: "outline" };
  return { text: `HTTP ${source.lastStatus ?? "—"}`, tone: "primary" };
}

export default async function AdminSourcesPage() {
  const profile = await requireStaff();
  const live = dataMode() === "live";

  const [sources, queue] = await Promise.all([
    live ? listSourcesForAdmin() : Promise.resolve([]),
    live ? getQueueSummary() : Promise.resolve(null),
  ]);

  const rows = sources ?? [];

  const columns: Column<AdminSourceRow>[] = [
    {
      key: "tool",
      header: "Tool",
      render: (source) => (
        <span className="flex flex-col">
          <span className="font-medium">{source.toolName}</span>
          <span className="max-w-xs truncate text-xs text-subtle">{source.url}</span>
        </span>
      ),
    },
    {
      key: "kind",
      header: "Kind",
      render: (source) => <span className="text-muted">{source.kind.replace("_", " ")}</span>,
    },
    {
      key: "fetch",
      header: "Last fetch",
      render: (source) => {
        const label = fetchLabel(source);
        return (
          <span className="flex flex-col gap-1">
            <Badge tone={label.tone}>{label.text}</Badge>
            {source.lastFetchedAt ? (
              <span className="text-xs text-subtle">{formatDate(source.lastFetchedAt)}</span>
            ) : null}
          </span>
        );
      },
    },
    {
      key: "hash",
      header: "Content",
      render: (source) => (
        <span className="font-mono text-xs text-subtle">
          {source.contentHash ? source.contentHash.slice(0, 10) : "—"}
        </span>
      ),
    },
    {
      key: "schedule",
      header: "Every",
      render: (source) => (
        <span className="tabular-nums text-muted">
          {source.refreshHours}h
          {source.active ? "" : " (paused)"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (source) => <EditCell href={`/admin/sources/${source.id}/edit`} live={live} />,
    },
  ];

  return (
    <>
      <AdminHeader profile={profile} title="Sources" />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <Card className="p-5 text-sm leading-relaxed text-muted">
          <p className="font-medium text-foreground">What this does, and what it does not</p>
          <p className="mt-2">
            The pipeline re-reads these pages on a schedule and records when their contents change.
            It stores a hash and a short excerpt — enough to notice a change, not a copy of someone
            else&apos;s page. Every fetch identifies itself and obeys{" "}
            <code className="text-xs">robots.txt</code>.
          </p>
          <p className="mt-2">
            Nothing here writes editorial content. Observed facts like prices carry a source and a
            timestamp, so they can be applied and checked; judgements — scores, rankings, verdicts —
            are never machine-made.
          </p>
        </Card>

        {queue ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs text-subtle">Queued</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{queue.pending}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-subtle">Running</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{queue.running}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-subtle">Failed</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{queue.failed}</p>
            </Card>
          </div>
        ) : null}

        {live ? <RunIngestButton /> : null}

        <AdminListToolbar
          count={rows.length}
          noun="source"
          createHref="/admin/sources/new"
          live={live}
        />

        <DataTable
          rows={rows}
          columns={columns}
          emptyTitle={live ? "No sources yet" : "Connect Supabase to watch sources"}
          emptyDescription="Add a vendor pricing page and the scheduled run will start watching it for changes."
        />
      </div>
    </>
  );
}
