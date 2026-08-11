import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { PricingBadge } from "@/components/ui/pricing-badge";
import { ToolLogo } from "@/components/ui/tool-logo";
import { affiliateHref, affiliateLinkAttributes, type CtaPosition } from "@/lib/affiliate/links";
import type { Tool } from "@/types";
import { cn } from "@/lib/utils/cn";

/**
 * The primary product surface. Hover changes surface + border only — no scaling,
 * so grids never reflow and Core Web Vitals stay clean.
 */
export function ToolCard({
  tool,
  sourceType = "home",
  position = "card",
  className,
}: {
  tool: Tool;
  sourceType?: "tool" | "category" | "article" | "comparison" | "best" | "review" | "home";
  position?: CtaPosition;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-card border border-border bg-card p-5 transition-[border-color,background-color,box-shadow] duration-200 hover:border-border-strong hover:bg-card-hover hover:shadow-[var(--elevation-1)]",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <ToolLogo name={tool.name} src={tool.logoUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold">
              <Link href={`/tools/${tool.slug}`} className="after:absolute after:inset-0">
                {tool.name}
              </Link>
            </h3>
            <Rating value={tool.rating} className="ml-auto shrink-0 text-muted" />
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
            {tool.shortDescription}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {tool.bestFor ? <Badge tone="primary">Best for: {tool.bestFor}</Badge> : null}
        {tool.categorySlugs.slice(0, 1).map((slug) => (
          <Badge key={slug} tone="outline">
            {slug.replace(/-/g, " ")}
          </Badge>
        ))}
        {tool.sponsored ? (
          <Badge tone="outline" className="text-subtle">
            Affiliate partner
          </Badge>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        <PricingBadge startingPrice={tool.startingPrice} model={tool.pricingModel} />

        {tool.sponsored ? (
          <a
            href={affiliateHref(tool.slug, { sourceType, position })}
            {...affiliateLinkAttributes}
            className="relative z-10 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-accent-soft"
          >
            Visit
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors group-hover:text-foreground">
            View Tool
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </span>
        )}
      </div>
    </article>
  );
}
