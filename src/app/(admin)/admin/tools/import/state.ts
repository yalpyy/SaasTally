import type { ImportLineError } from "@/lib/validation/tool-import";

/**
 * Import result, shared by the action and the form.
 *
 * Not in `actions.ts` because that file is `"use server"` and may only export
 * async functions — exporting the initial value from there throws on module
 * load and takes the page down before any of the import logic runs.
 */
export interface ImportState {
  status: "idle" | "error" | "done";
  message?: string;
  /** Kept so a failed paste is still in the textarea to fix. */
  text?: string;
  lineErrors?: ImportLineError[];
  created?: number;
  skipped?: string[];
  sourcesQueued?: number;
}

export const initialImportState: ImportState = { status: "idle" };
