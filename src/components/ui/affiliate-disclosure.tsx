import Link from "next/link";
import { Info } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils/cn";

export function AffiliateDisclosure({
  className,
  variant = "inline",
}: {
  className?: string;
  variant?: "inline" | "panel";
}) {
  if (variant === "panel") {
    return (
      <aside
        className={cn(
          "flex gap-3 rounded-card border border-border bg-elevated p-4 text-sm text-muted",
          className,
        )}
      >
        <Info className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden="true" />
        <p className="leading-relaxed">
          {siteConfig.affiliateDisclosure}{" "}
          <Link href="/affiliate-disclosure" className="text-foreground underline underline-offset-4">
            Read the full disclosure
          </Link>
          .
        </p>
      </aside>
    );
  }

  return (
    <p className={cn("text-xs leading-relaxed text-subtle", className)}>
      {siteConfig.affiliateDisclosure}{" "}
      <Link href="/affiliate-disclosure" className="underline underline-offset-4 hover:text-muted">
        Learn more
      </Link>
      .
    </p>
  );
}
