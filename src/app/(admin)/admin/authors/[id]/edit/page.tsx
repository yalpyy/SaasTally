import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { AuthorForm } from "@/components/admin/author-form";
import { requireStaff } from "@/lib/auth";
import { getAuthorForEdit } from "@/services/admin-content";

export const metadata = { title: "Edit author" };

export default async function EditAuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireStaff();
  const { id } = await params;

  const author = await getAuthorForEdit(id);
  if (!author) notFound();

  return (
    <>
      <AdminHeader profile={profile} title={`Edit ${author.name}`} />

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
          <AuthorForm
            author={{
              id: author.id,
              name: author.name,
              slug: author.slug,
              title: author.title,
              bio: author.bio,
              avatarUrl: author.avatarUrl,
              linkX: author.linkX,
              linkLinkedin: author.linkLinkedin,
              linkWebsite: author.linkWebsite,
            }}
          />
        </div>
      </div>
    </>
  );
}
