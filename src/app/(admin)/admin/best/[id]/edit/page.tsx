import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { BestListForm } from "@/components/admin/best-list-form";
import { requireStaff } from "@/lib/auth";
import { getBestListForEdit, listCategoryOptions } from "@/services/admin-content";

export const metadata = { title: "Edit best list" };

export default async function EditBestListPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireStaff();
  const { id } = await params;

  const [list, categories] = await Promise.all([getBestListForEdit(id), listCategoryOptions()]);
  if (!list) notFound();

  return (
    <>
      <AdminHeader profile={profile} title={`Edit ${list.title}`} />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/best"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to best lists
          </Link>

          <Link
            href={`/best/${list.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            View public page
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="max-w-3xl">
          <BestListForm
            categories={categories}
            list={{
              id: list.id,
              title: list.title,
              slug: list.slug,
              description: list.description,
              intro: list.intro,
              categoryId: list.categoryId,
              entries: list.entries,
              status: list.status,
              publishedAt: list.publishedAt,
            }}
          />
        </div>
      </div>
    </>
  );
}
