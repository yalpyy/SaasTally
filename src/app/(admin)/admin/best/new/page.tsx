import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { BestListForm } from "@/components/admin/best-list-form";
import { requireStaff } from "@/lib/auth";
import { listCategoryOptions } from "@/services/admin-content";

export const metadata = { title: "New best list" };

export default async function NewBestListPage() {
  const profile = await requireStaff();
  const categories = await listCategoryOptions();

  return (
    <>
      <AdminHeader profile={profile} title="New best list" />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <Link
          href="/admin/best"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to best lists
        </Link>

        <div className="max-w-3xl">
          <BestListForm categories={categories} />
        </div>
      </div>
    </>
  );
}
