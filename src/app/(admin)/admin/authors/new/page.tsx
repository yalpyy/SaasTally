import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { AuthorForm } from "@/components/admin/author-form";
import { requireStaff } from "@/lib/auth";

export const metadata = { title: "New author" };

export default async function NewAuthorPage() {
  const profile = await requireStaff();

  return (
    <>
      <AdminHeader profile={profile} title="New author" />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <Link
          href="/admin/authors"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to authors
        </Link>

        <div className="max-w-3xl">
          <AuthorForm />
        </div>
      </div>
    </>
  );
}
