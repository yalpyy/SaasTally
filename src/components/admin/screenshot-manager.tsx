"use client";

import { useActionState } from "react";
import Image from "next/image";
import { Loader2, Trash2, Upload } from "lucide-react";
import {
  removeToolScreenshotAction,
  uploadToolScreenshotAction,
  type ScreenshotFormState,
} from "@/app/(admin)/admin/tools/actions";
import { initialUploadFormState } from "@/lib/admin/form-types";
import { inputClass } from "@/components/admin/form-primitives";
import { Card } from "@/components/ui/card";
import type { ToolScreenshot } from "@/types";

/**
 * Screenshots, by hand.
 *
 * Sits outside the main tool form rather than inside it, for two reasons: a
 * form cannot be nested in another form, and an upload should not be tied to
 * saving the rest of the row — adding a screenshot is its own small action
 * that either worked or did not.
 */
export function ScreenshotManager({
  toolId,
  screenshots,
}: {
  toolId: string;
  screenshots: ToolScreenshot[];
}) {
  const [uploadState, uploadAction, uploading] = useActionState<ScreenshotFormState, FormData>(
    uploadToolScreenshotAction,
    initialUploadFormState,
  );

  const [removeState, removeAction, removing] = useActionState<ScreenshotFormState, FormData>(
    removeToolScreenshotAction,
    initialUploadFormState,
  );

  const error =
    uploadState.status === "error"
      ? uploadState.message
      : removeState.status === "error"
        ? removeState.message
        : null;

  return (
    <Card className="space-y-5 p-5">
      <div>
        <h2 className="text-sm font-semibold">Screenshots</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Uploaded by hand, never collected. A screenshot says what the product looks like today,
          which is a claim only a person who opened it can make. PNG, JPEG or WebP, up to 8 MB.
        </p>
      </div>

      {screenshots.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {screenshots.map((shot) => (
            <li key={shot.path} className="overflow-hidden rounded-xl border border-border">
              <div className="relative aspect-video bg-elevated">
                <Image
                  src={shot.url}
                  alt={shot.caption ?? "Product screenshot"}
                  fill
                  sizes="(min-width: 640px) 20rem, 100vw"
                  className="object-cover"
                />
              </div>

              <div className="flex items-start justify-between gap-3 p-3">
                <p className="text-xs leading-relaxed text-muted">
                  {shot.caption ?? <span className="text-subtle">No caption</span>}
                </p>

                <form action={removeAction}>
                  <input type="hidden" name="toolId" value={toolId} />
                  <input type="hidden" name="path" value={shot.path} />
                  <button
                    type="submit"
                    disabled={removing}
                    aria-label="Remove screenshot"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:text-danger disabled:opacity-60"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-subtle">
          No screenshots yet. The tool page renders its gallery only once there is one.
        </p>
      )}

      <form action={uploadAction} className="space-y-3">
        <input type="hidden" name="toolId" value={toolId} />

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Image</span>
          <input
            type="file"
            name="file"
            required
            accept="image/png,image/jpeg,image/webp"
            className="block w-full text-sm text-muted file:mr-3 file:h-9 file:rounded-lg file:border file:border-border file:bg-transparent file:px-3 file:text-sm file:font-medium file:text-foreground"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">
            Caption <span className="font-normal text-subtle">(optional)</span>
          </span>
          <input
            type="text"
            name="caption"
            maxLength={200}
            placeholder="Project dashboard, October 2026"
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          disabled={uploading}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-card-hover disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="size-4" aria-hidden="true" />
          )}
          {uploading ? "Uploading…" : "Add screenshot"}
        </button>
      </form>

      {error ? (
        <p className="rounded-xl border border-l-2 border-border border-l-danger p-3 text-sm text-muted">
          {error}
        </p>
      ) : null}

      {uploadState.status === "done" || removeState.status === "done" ? (
        <p className="text-sm text-subtle" role="status">
          {uploadState.status === "done" ? uploadState.message : removeState.message}
        </p>
      ) : null}
    </Card>
  );
}
