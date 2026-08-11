import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { ToolForm } from "@/components/admin/tool-form";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStaff } from "@/lib/auth";
import { getCategories } from "@/services/categories";

export const metadata = { title: "New tool" };

export default async function NewToolPage() {
  const profile = await requireStaff();
  const categories = await getCategories();

  return (
    <>
      <AdminHeader profile={profile} title="New tool" />

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
            <ToolForm categories={categories} />
          ) : (
            <EmptyState
              title="No categories yet"
              description="Every tool needs at least one category. Run supabase/seed/0001_categories.sql first."
            />
          )}
        </div>
      </div>
    </>
  );
}
