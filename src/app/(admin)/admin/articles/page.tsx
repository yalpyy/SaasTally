import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/auth";
import { getArticles } from "@/services/articles";
import { formatDate } from "@/lib/utils/format";
import type { Article } from "@/types";

export const metadata = { title: "Articles" };

export default async function AdminArticlesPage() {
  const profile = await requireStaff();
  const articles = await getArticles();

  const columns: Column<Article>[] = [
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
      render: (article) => <span className="text-muted">{article.categorySlug ?? "—"}</span>,
    },
    { key: "author", header: "Author", render: (article) => <span className="text-muted">{article.authorName}</span> },
    {
      key: "status",
      header: "Status",
      render: (article) => <Badge tone={article.status === "published" ? "primary" : "outline"}>{article.status}</Badge>,
    },
    {
      key: "published",
      header: "Published",
      render: (article) => <span className="text-xs text-subtle">{formatDate(article.publishedAt)}</span>,
    },
  ];

  return (
    <>
      <AdminHeader profile={profile} title="Articles" />
      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />
        <DataTable
          rows={articles}
          columns={columns}
          emptyTitle="No articles yet"
          emptyDescription="Guides and editorial content appear here once written."
        />
      </div>
    </>
  );
}
