import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { ArticleForm } from "@/components/admin/article-form";
import { requireStaff } from "@/lib/auth";
import { getCategories } from "@/services/categories";
import { listAuthorOptions } from "@/services/admin-content";

export const metadata = { title: "New article" };

export default async function NewArticlePage() {
  const profile = await requireStaff();
  const [categories, authors] = await Promise.all([getCategories(), listAuthorOptions()]);

  return (
    <>
      <AdminHeader profile={profile} title="New article" />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <Link
          href="/admin/articles"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to articles
        </Link>

        <div className="max-w-3xl">
          <ArticleForm categories={categories} authors={authors} />
        </div>
      </div>
    </>
  );
}
