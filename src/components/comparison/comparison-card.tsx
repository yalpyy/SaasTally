import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ToolLogo } from "@/components/ui/tool-logo";
import type { Comparison, Tool } from "@/types";
import { cn } from "@/lib/utils/cn";

export function ComparisonCard({
  comparison,
  tools,
  className,
}: {
  comparison: Comparison;
  tools: Tool[];
  className?: string;
}) {
  const [a, b] = tools;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-card border border-border bg-card p-5 transition-colors duration-200 hover:border-border-strong hover:bg-card-hover",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <ToolLogo name={a?.name ?? "A"} src={a?.logoUrl} size={36} />
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">vs</span>
        <ToolLogo name={b?.name ?? "B"} src={b?.logoUrl} size={36} />
      </div>

      <h3 className="mt-4 text-[15px] font-semibold">
        <Link href={`/compare/${comparison.slug}`} className="after:absolute after:inset-0">
          {comparison.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
        {comparison.quickVerdict}
      </p>

      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors group-hover:text-foreground">
        Compare
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </span>
    </article>
  );
}
