"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  affiliateProgramInputSchema,
  type AffiliateProgramInput,
} from "@/lib/validation/affiliate-program";

export interface ProgramFormState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** Echoed back so a failed submit does not wipe what the admin typed. */
  values?: Record<string, string | string[] | boolean>;
}

export const initialProgramFormState: ProgramFormState = { status: "idle" };

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readForm(formData: FormData) {
  return {
    toolId: text(formData, "toolId"),
    affiliateUrl: text(formData, "affiliateUrl"),
    network: text(formData, "network"),
    programName: text(formData, "programName"),
    commissionType: text(formData, "commissionType"),
    commissionValue: text(formData, "commissionValue"),
    cookieDays: text(formData, "cookieDays"),
    status: text(formData, "status"),
  };
}

function toRow(input: AffiliateProgramInput) {
  return {
    tool_id: input.toolId,
    affiliate_url: input.affiliateUrl,
    network: input.network,
    program_name: input.programName,
    commission_type: input.commissionType,
    commission_value: input.commissionValue,
    cookie_days: input.cookieDays,
    status: input.status,
  };
}

/**
 * Shared prologue.
 *
 * `requireStaff("admin")` rather than the editor gate: commercial terms are
 * admin-only in the UI and admin-only in RLS, and the two should not disagree.
 * A Server Action is a public endpoint, so this is the control — the sidebar
 * hiding the link is not.
 */
type PrepareResult =
  | { ok: false; failure: ProgramFormState }
  | {
      ok: true;
      supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;
      input: AffiliateProgramInput;
      raw: ProgramFormState["values"];
    };

async function prepare(formData: FormData): Promise<PrepareResult> {
  await requireStaff("admin");

  const raw = readForm(formData);
  const parsed = affiliateProgramInputSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      failure: {
        status: "error",
        message: "Some fields need attention.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        values: raw,
      },
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      failure: {
        status: "error",
        message:
          "Supabase is not configured, so nothing can be saved. Add the environment variables and try again.",
        values: raw,
      },
    };
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return {
      ok: false,
      failure: { status: "error", message: "Could not reach the database.", values: raw },
    };
  }

  return { ok: true, supabase, input: parsed.data, raw };
}

/**
 * The schema enforces at most one active program per tool
 * (`affiliate_programs_one_active_per_tool`). Postgres reports that as a
 * unique violation, which is a rule worth explaining rather than a failure.
 */
function duplicateActiveFailure(raw: ProgramFormState["values"]): ProgramFormState {
  return {
    status: "error",
    message:
      "This tool already has an active program. Pause the existing one before activating another.",
    fieldErrors: { status: ["Only one program per tool can be active"] },
    values: raw,
  };
}

function refresh() {
  revalidatePath("/admin/affiliate");
  // The sponsored label and the /go destination both derive from this row.
  revalidatePath("/software");
  revalidatePath("/");
}

export async function createProgramAction(
  _prevState: ProgramFormState,
  formData: FormData,
): Promise<ProgramFormState> {
  const prepared = await prepare(formData);
  if (!prepared.ok) return prepared.failure;

  const { supabase, input, raw } = prepared;

  const { error } = await supabase.from("affiliate_programs").insert(toRow(input));

  if (error) {
    if (error.code === "23505") return duplicateActiveFailure(raw);
    return {
      status: "error",
      message: "Could not save the program. Check your permissions and try again.",
      values: raw,
    };
  }

  refresh();
  redirect("/admin/affiliate");
}

export async function updateProgramAction(
  _prevState: ProgramFormState,
  formData: FormData,
): Promise<ProgramFormState> {
  const id = text(formData, "id");
  if (!id) {
    return { status: "error", message: "Missing program id. Reload the page and try again." };
  }

  const prepared = await prepare(formData);
  if (!prepared.ok) return prepared.failure;

  const { supabase, input, raw } = prepared;

  const { error } = await supabase.from("affiliate_programs").update(toRow(input)).eq("id", id);

  if (error) {
    if (error.code === "23505") return duplicateActiveFailure(raw);
    return {
      status: "error",
      message: "Could not update the program. Check your permissions and try again.",
      values: raw,
    };
  }

  refresh();
  redirect("/admin/affiliate");
}
