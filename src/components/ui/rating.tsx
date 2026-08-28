import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Compact editorial score, out of 10.
 *
 * Renders nothing when we have no score — we never invent ratings, and
 * structured data depends on this being honest.
 *
 * The scale is 10 everywhere since migration 0004: tool ratings and review
 * scores used to differ, so the same product could read 4.6 on a card and 9.2
 * on its review. The star is a marker for "this is our score", not a fifth of
 * anything, so the number is always shown alongside it.
 */
export function Rating({
  value,
  size = "sm",
  showValue = true,
  className,
}: {
  value: number | null | undefined;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}) {
  if (value === null || value === undefined) return null;

  const clamped = Math.max(0, Math.min(10, value));

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 font-medium tabular-nums", className)}
      aria-label={`Rated ${clamped.toFixed(1)} out of 10`}
    >
      <Star
        aria-hidden="true"
        className={cn("fill-current text-primary", size === "sm" ? "size-3.5" : "size-4")}
      />
      {showValue ? (
        <span className={size === "sm" ? "text-sm" : "text-base"}>
          {clamped.toFixed(1)}
          <span className="text-subtle">/10</span>
        </span>
      ) : null}
    </span>
  );
}
