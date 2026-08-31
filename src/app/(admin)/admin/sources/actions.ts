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
