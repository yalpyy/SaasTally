import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { ArticleForm } from "@/components/admin/article-form";
import { requireStaff } from "@/lib/auth";
import { getCategories } from "@/services/categories";
import { getArticleForEdit } from "@/services/admin-content";

export const metadata = { title: "Edit article" };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireStaff();
  const { id } = await params;

  const [article, categories] = await Promise.all([getArticleForEdit(id), getCategories()]);
  if (!article) notFound();

  return (
    <>
      <AdminHeader profile={profile} title={`Edit ${article.title}`} />

      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/articles"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to articles
          </Link>

          <Link
            href={`/articles/${article.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            View public page
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="max-w-3xl">
          <ArticleForm
            categories={categories}
            article={{
              id: article.id,
              title: article.title,
              slug: article.slug,
              excerpt: article.excerpt,
              content: article.content,
              featuredImage: article.featuredImage,
              authorName: article.authorName,
              categorySlug: article.categorySlug,
              readingMinutes: article.readingMinutes,
              seoTitle: article.seoTitle,
              seoDescription: article.seoDescription,
              canonicalUrl: article.canonicalUrl,
              status: article.status,
              publishedAt: article.publishedAt,
            }}
          />
        </div>
      </div>
    </>
  );
}
