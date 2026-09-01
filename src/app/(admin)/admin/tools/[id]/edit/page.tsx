import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { ToolForm } from "@/components/admin/tool-form";
import { ScreenshotManager } from "@/components/admin/screenshot-manager";
import { requireStaff } from "@/lib/auth";
import { getCategories } from "@/services/categories";
import { getToolForEdit } from "@/services/admin-tools";

export const metadata = { title: "Edit tool" };

export default async function EditToolPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireStaff();
  const { id } = await params;

  const [tool, categories] = await Promise.all([getToolForEdit(id), getCategories()]);
  if (!tool) notFound();

  return (
    <>
      <AdminHeader profile={profile} title={`Edit ${tool.name}`} />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/tools"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to tools
          </Link>

          <Link
            href={`/tools/${tool.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            View public page
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="max-w-3xl space-y-6">
          <ToolForm categories={categories} tool={tool} />
          <ScreenshotManager toolId={tool.id} screenshots={tool.screenshots} />
        </div>
      </div>
    </>
  );
}
