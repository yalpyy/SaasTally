import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { ComparisonForm } from "@/components/admin/comparison-form";
import { requireStaff } from "@/lib/auth";
import { listToolOptions } from "@/services/admin-affiliate";
import { getComparisonForEdit } from "@/services/admin-content";

export const metadata = { title: "Edit comparison" };

export default async function EditComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireStaff();
  const { id } = await params;

  const [comparison, tools] = await Promise.all([getComparisonForEdit(id), listToolOptions()]);
  if (!comparison) notFound();

  return (
    <>
      <AdminHeader profile={profile} title={`Edit ${comparison.title}`} />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/comparisons"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to comparisons
          </Link>

          <Link
            href={`/compare/${comparison.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            View public page
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="max-w-3xl">
          <ComparisonForm
            tools={tools}
            comparison={{
              id: comparison.id,
              title: comparison.title,
              slug: comparison.slug,
              toolAId: comparison.toolAId,
              toolBId: comparison.toolBId,
              quickVerdict: comparison.quickVerdict,
              recommendation: comparison.recommendation,
              attributes: comparison.attributes,
              status: comparison.status,
              publishedAt: comparison.publishedAt,
            }}
          />
        </div>
      </div>
    </>
  );
}
