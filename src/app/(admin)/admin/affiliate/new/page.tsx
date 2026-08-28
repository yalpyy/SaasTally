import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { AffiliateProgramForm } from "@/components/admin/affiliate-program-form";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStaff } from "@/lib/auth";
import { listToolOptions } from "@/services/admin-affiliate";

export const metadata = { title: "New affiliate program" };

export default async function NewAffiliateProgramPage() {
  const profile = await requireStaff("admin");
  const tools = await listToolOptions();

  return (
    <>
      <AdminHeader profile={profile} title="New affiliate program" />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <Link
          href="/admin/affiliate"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to affiliate programs
        </Link>

        <div className="max-w-3xl">
          {tools.length > 0 ? (
            <AffiliateProgramForm tools={tools} />
          ) : (
            <EmptyState
              title="No tools yet"
              description="A program attaches to a tool. Create the tool first, then come back."
            />
          )}
        </div>
      </div>
    </>
  );
}
