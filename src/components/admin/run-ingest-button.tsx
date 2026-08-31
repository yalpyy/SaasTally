"use client";

import { useActionState, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { runIngestNowAction } from "@/app/(admin)/admin/sources/actions";
import { initialRunState, type RunState } from "@/app/(admin)/admin/sources/run-state";
import { Card } from "@/components/ui/card";

/**
 * Runs the ingest queue on demand.
 *
 * The pipeline is scheduled, which is right for keeping a catalogue current
 * and useless when you have just added fifty sources and want to know whether
 * any of it works. This is that answer, without anyone needing a terminal or a
 * copy of the cron secret.
 */
export function RunIngestButton() {
  const [state, formAction, isPending] = useActionState<RunState, FormData>(
    runIngestNowAction,
    initialRunState,
  );

  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-card-hover disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="size-4" aria-hidden="true" />
          )}
          {isPending ? "Running…" : "Run now"}
        </button>

        {isPending ? (
          <span className="text-xs text-subtle">
            Fetching pages one host at a time. This takes up to a minute.
          </span>
        ) : null}
      </form>

      {state.status === "error" ? (
        <Card className="border-l-2 border-l-danger p-4 text-sm">
          <p className="leading-relaxed text-muted">{state.message}</p>
        </Card>
      ) : null}

      {state.status === "done" ? (
        <Card className="p-4 text-sm">
          <p className="font-medium">{state.message}</p>

          {state.remaining ? (
            <p className="mt-1 text-muted">
              {state.remaining} job{state.remaining === 1 ? "" : "s"} still queued — run again to
              continue. Requests are spaced out per host, so a large batch takes several passes.
            </p>
          ) : null}

          {state.details && state.details.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setShowDetails((open) => !open)}
                className="mt-3 text-xs text-subtle underline underline-offset-4 hover:text-foreground"
              >
                {showDetails ? "Hide" : "Show"} what happened
              </button>

              {showDetails ? (
                <ul className="mt-3 space-y-1 font-mono text-xs text-subtle">
                  {state.details.map((line, index) => (
                    <li key={index} className="break-words">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
