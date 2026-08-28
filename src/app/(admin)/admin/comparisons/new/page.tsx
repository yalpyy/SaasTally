import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { ComparisonForm } from "@/components/admin/comparison-form";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStaff } from "@/lib/auth";
import { listToolOptions } from "@/services/admin-affiliate";

export const metadata = { title: "New comparison" };

export default async function NewComparisonPage() {
  const profile = await requireStaff();
  const tools = await listToolOptions();

  return (
    <>
      <AdminHeader profile={profile} title="New comparison" />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <Link
          href="/admin/comparisons"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to comparisons
        </Link>

        <div className="max-w-3xl">
          {tools.length > 1 ? (
            <ComparisonForm tools={tools} />
          ) : (
            <EmptyState
              title="Not enough tools yet"
              description="A comparison needs two tools. Create them first, then come back."
            />
          )}
        </div>
      </div>
    </>
  );
}
