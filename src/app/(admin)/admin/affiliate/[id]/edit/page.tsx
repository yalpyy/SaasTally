import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { AffiliateProgramForm } from "@/components/admin/affiliate-program-form";
import { requireStaff } from "@/lib/auth";
import { getProgramForEdit, listToolOptions } from "@/services/admin-affiliate";

export const metadata = { title: "Edit affiliate program" };

export default async function EditAffiliateProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireStaff("admin");
  const { id } = await params;

  const [program, tools] = await Promise.all([getProgramForEdit(id), listToolOptions()]);
  if (!program) notFound();

  return (
    <>
      <AdminHeader profile={profile} title={`Edit ${program.toolName} program`} />

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
          <AffiliateProgramForm
            tools={tools}
            program={{
              id: program.id,
              toolId: program.toolId,
              affiliateUrl: program.affiliateUrl,
              network: program.network ?? "",
              programName: program.programName ?? "",
              commissionType: program.commissionType ?? "percentage",
              commissionValue: program.commissionValue ?? "",
              cookieDays: program.cookieDays === null ? "" : String(program.cookieDays),
              status: program.status,
            }}
          />
        </div>
      </div>
    </>
  );
}
