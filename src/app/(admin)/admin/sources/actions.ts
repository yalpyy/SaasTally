"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  prepareForm,
  text,
  checkbox,
  saveFailure,
  UNIQUE_VIOLATION,
  type AdminFormState,
} from "@/lib/admin/form-state";
import {
  contentSourceInputSchema,
  type ContentSourceInput,
} from "@/lib/validation/content-source";
import { requireStaff } from "@/lib/auth";
import { runIngestBatch } from "@/lib/ingest/runner";
import { ingestClient, markLogolessSourcesDue } from "@/lib/ingest/queue";
import type { RunState } from "./run-state";

export type SourceFormState = AdminFormState;

function readForm(formData: FormData) {
  return {
    toolId: text(formData, "toolId"),
    url: text(formData, "url"),
    kind: text(formData, "kind"),
    refreshHours: text(formData, "refreshHours"),
    active: checkbox(formData, "active"),
  };
}

function toRow(input: ContentSourceInput) {
  return {
    tool_id: input.toolId,
    url: input.url,
    kind: input.kind,
    refresh_hours: input.refreshHours,
    active: input.active,
  };
}

function duplicateUrlFailure(url: string, raw: SourceFormState["values"]): SourceFormState {
  return {
    status: "error",
    message: `${url} is already being watched.`,
    fieldErrors: { url: ["This URL is already a source"] },
    values: raw,
  };
}

export async function createSourceAction(
  _prevState: SourceFormState,
  formData: FormData,
): Promise<SourceFormState> {
  const prepared = await prepareForm(contentSourceInputSchema, readForm(formData));
  if (!prepared.ok) return prepared.failure;

  const { supabase, input, raw } = prepared;

  // `next_run_at` defaults to now(), so a new source is picked up by the next
  // cron run rather than waiting a full refresh interval to be seen once.
  const { error } = await supabase.from("content_sources").insert(toRow(input));

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return duplicateUrlFailure(input.url, raw);
    return saveFailure("source", raw);
  }

  revalidatePath("/admin/sources");
  redirect("/admin/sources");
}

export async function updateSourceAction(
  _prevState: SourceFormState,
  formData: FormData,
): Promise<SourceFormState> {
  const id = text(formData, "id");
  if (!id) {
    return { status: "error", message: "Missing source id. Reload the page and try again." };
  }

  const prepared = await prepareForm(contentSourceInputSchema, readForm(formData));
  if (!prepared.ok) return prepared.failure;

  const { supabase, input, raw } = prepared;

  const { error } = await supabase.from("content_sources").update(toRow(input)).eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return duplicateUrlFailure(input.url, raw);
    return saveFailure("source", raw);
  }

  revalidatePath("/admin/sources");
  redirect("/admin/sources");
}

/**
 * Run the ingest queue now, from the admin.
 *
 * Same work the nightly cron does; the difference is only how the caller is
 * authorised — a signed-in staff member here, a shared secret there. Having
 * this button means nobody has to hold a secret in a terminal to see whether
 * the pipeline works.
 *
 * The budget is deliberately short. A Vercel function is capped at 60s on the
 * smaller plans, so this drains what it can and reports what is left rather
 * than being killed halfway with nothing to show.
 */
export async function runIngestNowAction(
  // Required by useActionState's signature; the run takes no prior state.
  _prevState: RunState,
  formData: FormData,
): Promise<RunState> {
  await requireStaff();

  /**
   * "logos" mode exists because the schedule is the wrong tool for a backfill.
   * Every source in an already-populated catalogue is days from its next run,
   * so a plain run would report "nothing was due" while 43 tools sat there
   * with no logo. This brings exactly those sources forward and then runs the
   * ordinary batch — no separate code path doing the work differently.
   */
  const logosOnly = text(formData, "mode") === "logos";
  let brought = 0;

  if (logosOnly) {
    const supabase = ingestClient();
    if (!supabase) {
      return { status: "error", message: "Collecting logos needs SUPABASE_SECRET_KEY." };
    }
    brought = await markLogolessSourcesDue(supabase);
  }

  const summary = await runIngestBatch(45_000, logosOnly ? "admin-logos" : "admin");

  if (!summary.ok) {
    return { status: "error", message: summary.error ?? "Could not start the run." };
  }

  revalidatePath("/admin/sources");
  revalidatePath("/admin/tools");

  return {
    status: "done",
    message:
      summary.processed === 0 && summary.queued === 0
        ? logosOnly
          ? "Every tool already has a logo."
          : "Nothing was due. Sources are re-checked on their own schedule."
        : `Processed ${summary.processed}, failed ${summary.failed}.${
            logosOnly && brought > 0 ? ` ${brought} source${brought === 1 ? "" : "s"} brought forward.` : ""
          }`,
    processed: summary.processed,
    failed: summary.failed,
    remaining: summary.remaining,
    details: summary.details,
  };
}
