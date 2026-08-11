import { Check, Minus } from "lucide-react";
import { Card } from "./card";

export function ProsCons({ pros, cons }: { pros: string[]; cons: string[] }) {
  if (pros.length === 0 && cons.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="p-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">Pros</h3>
        <ul className="mt-4 space-y-3">
          {pros.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-subtle">Cons</h3>
        <ul className="mt-4 space-y-3">
          {cons.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
              <Minus className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
