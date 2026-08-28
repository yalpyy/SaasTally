import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { ReviewForm } from "@/components/admin/review-form";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStaff } from "@/lib/auth";
import { listToolOptions } from "@/services/admin-affiliate";
import { listAuthorOptions } from "@/services/admin-content";

export const metadata = { title: "New review" };

export default async function NewReviewPage() {
  const profile = await requireStaff();
  const [tools, authors] = await Promise.all([listToolOptions(), listAuthorOptions()]);

  return (
    <>
      <AdminHeader profile={profile} title="New review" />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <Link
          href="/admin/reviews"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to reviews
        </Link>

        <div className="max-w-3xl">
          {tools.length > 0 ? (
            <ReviewForm tools={tools} authors={authors} />
          ) : (
            <EmptyState
              title="No tools yet"
              description="A review covers a tool. Create the tool first, then come back."
            />
          )}
        </div>
      </div>
    </>
  );
}
