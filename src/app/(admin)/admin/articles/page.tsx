import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { AdminListToolbar, EditCell } from "@/components/admin/admin-list-toolbar";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/auth";
import { getArticles } from "@/services/articles";
import { listArticlesForAdmin, type AdminArticleRow } from "@/services/admin-content";
import { dataMode } from "@/lib/supabase/config";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Articles" };

export default async function AdminArticlesPage() {
  const profile = await requireStaff();
  const live = dataMode() === "live";

  // In live mode read through the admin service so drafts are listed too.
  const articles: AdminArticleRow[] = live
    ? ((await listArticlesForAdmin()) ?? [])
    : (await getArticles()).map((article) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        featuredImage: article.featuredImage ?? "",
        authorName: article.authorName,
        categorySlug: article.categorySlug ?? "",
        readingMinutes: String(article.readingMinutes),
        seoTitle: article.seoTitle ?? "",
        seoDescription: article.seoDescription ?? "",
        canonicalUrl: article.canonicalUrl ?? "",
        status: article.status,
        publishedAt: "",
        updatedAt: article.updatedAt,
      }));

  const columns: Column<AdminArticleRow>[] = [
    {
      key: "title",
      header: "Title",
      render: (article) => (
        <Link href={`/articles/${article.slug}`} className="font-medium hover:underline">
          {article.title}
        </Link>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (article) => <span className="text-muted">{article.categorySlug || "—"}</span>,
    },
    {
      key: "author",
      header: "Author",
      render: (article) => (
        <span className="text-muted">{article.authorName || "SaaSTally Editorial"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (article) => (
        <Badge tone={article.status === "published" ? "primary" : "outline"}>
          {article.status}
        </Badge>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      render: (article) => (
        <span className="text-xs text-subtle">{formatDate(article.updatedAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (article) => <EditCell href={`/admin/articles/${article.id}/edit`} live={live} />,
    },
  ];

  return (
    <>
      <AdminHeader profile={profile} title="Articles" />
      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <AdminListToolbar
          count={articles.length}
          noun="article"
          createHref="/admin/articles/new"
          live={live}
        />

        <DataTable rows={articles} columns={columns} emptyTitle="No articles yet" />
      </div>
    </>
  );
}
