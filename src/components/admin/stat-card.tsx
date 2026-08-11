import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  Icon: LucideIcon;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-elevated text-subtle">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-subtle">{hint}</p> : null}
    </Card>
  );
}
