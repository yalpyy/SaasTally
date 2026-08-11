import type { RatingCriterion } from "@/types";
import { cn } from "@/lib/utils/cn";

/** Score bars out of 10, used on review pages and the tool verdict block. */
export function RatingBreakdown({
  criteria,
  className,
}: {
  criteria: RatingCriterion[];
  className?: string;
}) {
  if (criteria.length === 0) return null;

  return (
    <dl className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {criteria.map((criterion) => {
        const percent = Math.max(0, Math.min(100, (criterion.score / 10) * 100));
        return (
          <div key={criterion.label} className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-muted">{criterion.label}</dt>
              <dd className="text-sm font-semibold tabular-nums">{criterion.score.toFixed(1)}</dd>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-card-hover">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </dl>
  );
}
