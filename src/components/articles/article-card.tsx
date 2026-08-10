import Link from "next/link";
import { Clock } from "lucide-react";
import type { Article } from "@/types";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * Editorial content is visually distinct from product cards: no logo tile, a
 * rule instead of a border-heavy surface, and a serif-adjacent reading rhythm.
 */
export function ArticleCard({ article, className }: { article: Article; className?: string }) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-card bg-elevated p-6 ring-1 ring-inset ring-border transition-colors duration-200 hover:bg-card-hover",
        className,
      )}
    >
      <div className="flex items-center gap-3 text-xs text-subtle">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-1 font-medium text-primary">
          Guide
        </span>
        <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-snug">
        <Link href={`/articles/${article.slug}`} className="after:absolute after:inset-0">
          {article.title}
        </Link>
      </h3>

      <p className="mt-2.5 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
        {article.excerpt}
      </p>

      <div className="mt-5 flex items-center gap-2 text-xs text-subtle">
        <Clock className="size-3.5" aria-hidden="true" />
        {article.readingMinutes} min read
        <span aria-hidden="true">·</span>
        {article.authorName}
      </div>
    </article>
  );
}
