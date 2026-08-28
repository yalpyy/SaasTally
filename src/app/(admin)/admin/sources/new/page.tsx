import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { SourceForm } from "@/components/admin/source-form";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStaff } from "@/lib/auth";
import { listToolOptions } from "@/services/admin-affiliate";

export const metadata = { title: "New source" };

export default async function NewSourcePage() {
  const profile = await requireStaff();
  const tools = await listToolOptions();

  return (
    <>
      <AdminHeader profile={profile} title="New source" />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <Link
          href="/admin/sources"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to sources
        </Link>

        <div className="max-w-3xl">
          {tools.length > 0 ? (
            <SourceForm tools={tools} />
          ) : (
            <EmptyState
              title="No tools yet"
              description="A source belongs to a tool. Create the tool first, then come back."
            />
          )}
        </div>
      </div>
    </>
  );
}
