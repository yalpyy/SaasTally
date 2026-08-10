import { AlertTriangle } from "lucide-react";
import { dataMode } from "@/lib/supabase/config";

/**
 * Explicit, honest state. In mock mode nothing can be saved, so we say so
 * rather than rendering forms that silently discard input.
 */
export function ModeBanner() {
  if (dataMode() === "live") return null;

  return (
    <div className="flex gap-3 rounded-card border border-warning/30 bg-warning/5 p-4 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      <p className="leading-relaxed text-muted">
        <span className="font-medium text-foreground">Mock mode.</span> No Supabase credentials are
        configured, so this screen reads development fixtures and cannot save changes. Add
        <code className="mx-1 rounded bg-card-hover px-1.5 py-0.5 text-xs">
          NEXT_PUBLIC_SUPABASE_URL
        </code>
        and
        <code className="mx-1 rounded bg-card-hover px-1.5 py-0.5 text-xs">
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        </code>
        to <code className="rounded bg-card-hover px-1.5 py-0.5 text-xs">.env.local</code> to enable
        live data.
      </p>
    </div>
  );
}
