import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Compact 5-point rating. Renders nothing when we have no editorial score —
 * we never invent ratings, and structured data depends on this being honest.
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

  const clamped = Math.max(0, Math.min(5, value));

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 font-medium tabular-nums", className)}
      aria-label={`Rated ${clamped.toFixed(1)} out of 5`}
    >
      <Star
        aria-hidden="true"
        className={cn("fill-current text-primary", size === "sm" ? "size-3.5" : "size-4")}
      />
      {showValue ? (
        <span className={size === "sm" ? "text-sm" : "text-base"}>{clamped.toFixed(1)}</span>
      ) : null}
    </span>
  );
}
