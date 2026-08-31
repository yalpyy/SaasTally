/**
 * Result of a manual ingest run.
 *
 * Kept out of `actions.ts`: that file is `"use server"` and may only export
 * async functions, so the initial value cannot live there.
 */
export interface RunState {
  status: "idle" | "done" | "error";
  message?: string;
  processed?: number;
  failed?: number;
  remaining?: number;
  details?: string[];
}

export const initialRunState: RunState = { status: "idle" };
