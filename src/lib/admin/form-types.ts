/**
 * Form state shared by the admin editors.
 *
 * Deliberately separate from `form-state.ts`, and deliberately free of both
 * `server-only` and `"use server"`:
 *
 *  - `form-state.ts` is `server-only`, so a client component cannot import
 *    from it at all.
 *  - A `"use server"` file may only export async functions. Exporting the
 *    initial state constant from an action file makes the whole module throw
 *    at load time — "can only export async functions, found object" — which
 *    takes down the page rather than the one form.
 *
 * So the constant lives here, where both sides can reach it.
 */

export interface AdminFormState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** Echoed back so a failed submit does not wipe what the editor typed. */
  values?: Record<string, string | string[] | boolean>;
}

export const initialAdminFormState: AdminFormState = { status: "idle" };

/**
 * State for the media uploads, which are not editors.
 *
 * A screenshot upload has no field errors to echo and nothing to repopulate —
 * a file input cannot be given a value back — but it does have a success
 * worth reporting, which the editor states deliberately do not.
 */
export interface UploadFormState {
  status: "idle" | "error" | "done";
  message?: string;
}

export const initialUploadFormState: UploadFormState = { status: "idle" };
