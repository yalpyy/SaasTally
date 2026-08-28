import "server-only";

import type { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { StaffRole } from "@/types";

/**
 * Shared shape for every admin editor.
 *
 * The tool editor established this pattern; extracting it here is what keeps
 * five content types from drifting into five slightly different ideas of what
 * a failed submit looks like.
 */
export interface AdminFormState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** Echoed back so a failed submit does not wipe what the editor typed. */
  values?: Record<string, string | string[] | boolean>;
}

export const initialAdminFormState: AdminFormState = { status: "idle" };

/* ------------------------------------------------------------------------- */
/* FormData readers                                                          */
/* ------------------------------------------------------------------------- */

export function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function checkbox(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

export function list(formData: FormData, key: string): string[] {
  return formData.getAll(key).map(String);
}

/* ------------------------------------------------------------------------- */
/* Prologue                                                                  */
/* ------------------------------------------------------------------------- */

export type SupabaseClient = NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;

export type Prepared<T> =
  | { ok: false; failure: AdminFormState }
  | { ok: true; supabase: SupabaseClient; input: T; raw: AdminFormState["values"] };

/**
 * Authorise, validate, connect — in that order, for every mutating action.
 *
 * `requireStaff()` runs first because a Server Action is a public HTTP
 * endpoint: anyone can invoke it, so hiding the form is not authorisation. The
 * write then goes through the **session** client, meaning Postgres RLS
 * re-checks the caller's role. Two independent gates, deliberately.
 */
export async function prepareForm<Schema extends z.ZodTypeAny>(
  schema: Schema,
  raw: Record<string, string | string[] | boolean>,
  role: StaffRole = "editor",
): Promise<Prepared<z.infer<Schema>>> {
  await requireStaff(role);

  const parsed = schema.safeParse(raw);

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

/* ------------------------------------------------------------------------- */
/* Common failures                                                           */
/* ------------------------------------------------------------------------- */

/** 23505 is Postgres' unique_violation — for our tables, almost always a slug. */
export const UNIQUE_VIOLATION = "23505";

export function duplicateSlugFailure(
  slug: string,
  raw: AdminFormState["values"],
): AdminFormState {
  return {
    status: "error",
    message: `The slug "${slug}" is already taken. Choose a different one.`,
    fieldErrors: { slug: ["This slug is already in use"] },
    values: raw,
  };
}

export function saveFailure(what: string, raw: AdminFormState["values"]): AdminFormState {
  return {
    status: "error",
    message: `Could not save the ${what}. Check your permissions and try again.`,
    values: raw,
  };
}
