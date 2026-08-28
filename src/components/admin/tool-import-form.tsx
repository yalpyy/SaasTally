"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import {
  importToolsAction,
  initialImportState,
  type ImportState,
} from "@/app/(admin)/admin/tools/import/actions";
import { Card } from "@/components/ui/card";
import { Field, Fieldset, FormError, inputClass } from "@/components/admin/form-primitives";

const PLACEHOLDER = `Semrush | https://www.semrush.com | seo,marketing | https://www.semrush.com/prices/
Ahrefs | https://ahrefs.com | seo | https://ahrefs.com/pricing
Notion | https://www.notion.so | productivity,project-management`;

export function ToolImportForm({ categorySlugs }: { categorySlugs: string[] }) {
  const [state, formAction, isPending] = useActionState<ImportState, FormData>(
    importToolsAction,
    initialImportState,
  );

  return (
    <div className="space-y-6">
      <Card className="p-5 text-sm leading-relaxed text-muted">
        <p className="font-medium text-foreground">One tool per line</p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-elevated p-3 font-mono text-xs">
          Name | website URL | categories | pricing URL (optional)
        </pre>
        <p className="mt-3">
          Imported tools are created <strong className="text-foreground">inactive</strong>. A row
          with a name and a URL and nothing else is not something a reader should find — it becomes
          visible once someone has filled in what the page actually says.
        </p>
        <p className="mt-2">
          A pricing URL is also registered as a watched source, so the scheduled run starts
          collecting its facts without a second trip through the admin.
        </p>
        <p className="mt-3 text-xs">
          Known categories:{" "}
          <span className="font-mono">{categorySlugs.join(", ") || "none yet"}</span>
        </p>
      </Card>

      {state.status === "error" ? <FormError message={state.message} /> : null}

      {state.status === "done" ? (
        <div className="flex gap-3 rounded-card border border-primary/30 bg-primary/5 p-4 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="leading-relaxed">
            <p className="font-medium">{state.message}</p>
            {state.sourcesQueued ? (
              <p className="mt-1 text-muted">
                {state.sourcesQueued} pricing page{state.sourcesQueued === 1 ? "" : "s"} added to{" "}
                <Link href="/admin/sources" className="underline underline-offset-4">
                  Sources
                </Link>
                .
              </p>
            ) : null}
            {state.skipped && state.skipped.length > 0 ? (
              <p className="mt-1 text-muted">
                Already existed, skipped: <span className="font-mono">{state.skipped.join(", ")}</span>
              </p>
            ) : null}
            {state.created ? (
              <p className="mt-2">
                <Link href="/admin/tools" className="underline underline-offset-4">
                  Open the catalogue
                </Link>{" "}
                to fill them in.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {state.lineErrors && state.lineErrors.length > 0 ? (
        <Card className="border-l-2 border-l-danger p-5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="size-4 text-danger" aria-hidden="true" />
            Nothing was imported
          </p>
          <ul className="mt-4 space-y-3">
            {state.lineErrors.map((error) => (
              <li key={error.lineNumber} className="text-sm">
                <span className="font-mono text-xs text-subtle">Line {error.lineNumber}</span>
                <p className="mt-0.5 text-danger">{error.message}</p>
                <p className="mt-0.5 truncate font-mono text-xs text-subtle">{error.raw}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <form action={formAction} className="space-y-6">
        <Fieldset title="Paste your list">
          <Field label="Tools" name="text" hint="Blank lines and lines starting with # are ignored.">
            <textarea
              id="text"
              name="text"
              rows={14}
              defaultValue={state.text ?? ""}
              className={`${inputClass} font-mono text-xs`}
              placeholder={PLACEHOLDER}
            />
          </Field>
        </Fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Import
          </button>

          <Link
            href="/admin/tools"
            className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-medium transition-colors hover:bg-card-hover"
          >
            Back to tools
          </Link>
        </div>
      </form>
    </div>
  );
}
