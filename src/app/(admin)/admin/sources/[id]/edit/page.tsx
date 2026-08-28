import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { SourceForm } from "@/components/admin/source-form";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/auth";
import { listToolOptions } from "@/services/admin-affiliate";
import { getSourceForEdit } from "@/services/admin-ingest";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Edit source" };

export default async function EditSourcePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireStaff();
  const { id } = await params;

  const [source, tools] = await Promise.all([getSourceForEdit(id), listToolOptions()]);
  if (!source) notFound();

  return (
    <>
      <AdminHeader profile={profile} title={`Source for ${source.toolName}`} />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <Link
          href="/admin/sources"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to sources
        </Link>

        <div className="max-w-3xl space-y-6">
          {source.lastError ? (
            <Card className="border-l-2 border-l-danger p-5 text-sm">
              <p className="font-medium">Last fetch failed</p>
              <p className="mt-2 leading-relaxed text-muted">{source.lastError}</p>
            </Card>
          ) : null}

          <Card className="p-5 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-subtle">Last fetched</dt>
                <dd className="mt-1">
                  {source.lastFetchedAt ? formatDate(source.lastFetchedAt) : "Never"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-subtle">Next run</dt>
                <dd className="mt-1">{formatDate(source.nextRunAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-subtle">Content hash</dt>
                <dd className="mt-1 font-mono text-xs">{source.contentHash ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-subtle">Last status</dt>
                <dd className="mt-1 tabular-nums">{source.lastStatus ?? "—"}</dd>
              </div>
            </dl>
          </Card>

          <SourceForm
            tools={tools}
            source={{
              id: source.id,
              toolId: source.toolId,
              url: source.url,
              kind: source.kind,
              refreshHours: String(source.refreshHours),
              active: source.active,
            }}
          />
        </div>
      </div>
    </>
  );
}
