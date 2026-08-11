import Link from "next/link";
import { getCategoryIcon } from "@/lib/icons";
import type { Category } from "@/types";
import { cn } from "@/lib/utils/cn";

export function CategoryCard({ category, className }: { category: Category; className?: string }) {
  const Icon = getCategoryIcon(category.icon);

  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "group flex h-full flex-col rounded-card border border-border bg-card p-5 transition-[border-color,background-color] duration-200 hover:border-border-strong hover:bg-card-hover",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-elevated text-primary transition-colors group-hover:bg-accent-soft">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-[15px] font-semibold">{category.name}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
        {category.description}
      </p>
      {typeof category.toolCount === "number" ? (
        <p className="mt-4 text-xs text-subtle">{category.toolCount} tools</p>
      ) : null}
    </Link>
  );
}
