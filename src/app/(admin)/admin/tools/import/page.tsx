import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { ToolImportForm } from "@/components/admin/tool-import-form";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStaff } from "@/lib/auth";
import { getCategories } from "@/services/categories";

export const metadata = { title: "Import tools" };

export default async function ImportToolsPage() {
  const profile = await requireStaff();
  const categories = await getCategories();

  return (
    <>
      <AdminHeader profile={profile} title="Import tools" />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <Link
          href="/admin/tools"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to tools
        </Link>

        <div className="max-w-3xl">
          {categories.length > 0 ? (
            <ToolImportForm categorySlugs={categories.map((category) => category.slug)} />
          ) : (
            <EmptyState
              title="No categories yet"
              description="Every tool needs at least one category. Run supabase/seed/0001_categories.sql, then come back."
            />
          )}
        </div>
      </div>
    </>
  );
}
