import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  GitCompareArrows,
  LayoutGrid,
  Package,
  Star,
  Trophy,
} from "lucide-react";
import type { SearchResult, SearchResultType } from "@/types";
import { cn } from "@/lib/utils/cn";

const meta: Record<SearchResultType, { label: string; Icon: typeof Package }> = {
  tool: { label: "Tool", Icon: Package },
  category: { label: "Category", Icon: LayoutGrid },
  best: { label: "Best list", Icon: Trophy },
  comparison: { label: "Comparison", Icon: GitCompareArrows },
  review: { label: "Review", Icon: Star },
  article: { label: "Guide", Icon: BookOpen },
};

export function ResultList({
  results,
  onNavigate,
  className,
}: {
  results: SearchResult[];
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-1", className)}>
      {results.map((result) => {
        const { label, Icon } = meta[result.type];
        return (
          <li key={result.id}>
            <Link
              href={result.href}
              onClick={onNavigate}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-card-hover"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-subtle">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{result.title}</span>
                  <span className="shrink-0 text-[11px] uppercase tracking-wider text-subtle">
                    {label}
                  </span>
                </span>
                {result.subtitle ? (
                  <span className="mt-0.5 block truncate text-xs text-muted">{result.subtitle}</span>
                ) : null}
              </span>
              <ArrowUpRight
                className="size-4 shrink-0 text-subtle opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
