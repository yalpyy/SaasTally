import "server-only";

import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Supabase Storage, from the server.
 *
 * Two callers, two clients, on purpose:
 *
 *  - An editor uploading a screenshot goes through the **session** client, so
 *    the storage policies in migration 0007 re-check that they are staff. The
 *    form being hidden is not authorisation; a Server Action is a public
 *    endpoint like any other.
 *  - The ingest pipeline has no signed-in user at 3am, so it goes through the
 *    service role and bypasses those policies. That is the one legitimate
 *    reason to use it here.
 *
 * Everything is stored in public buckets. These are catalogue images on public
 * pages — a signed URL would buy no privacy and cost us the CDN.
 */

export const BUCKETS = {
  toolLogos: "tool-logos",
  toolScreenshots: "tool-screenshots",
  articleImages: "article-images",
  authors: "authors",
  siteAssets: "site-assets",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

export const ALL_BUCKETS: BucketName[] = Object.values(BUCKETS);

/**
 * Types we are willing to store and can actually render.
 *
 * `next/image` will not optimise SVG unless the app opts into serving
 * untrusted markup, and it cannot decode ICO at all, so accepting either would
 * mean storing files that render as a broken image. Better to reject them at
 * the door than to discover it on the page.
 */
export const IMAGE_MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function extensionForMime(contentType: string): string | null {
  const base = contentType.split(";")[0].trim().toLowerCase();
  return IMAGE_MIME_EXTENSIONS[base] ?? null;
}

/** Whether storage can be reached at all — i.e. Supabase is configured. */
export function isStorageConfigured(): boolean {
  return SUPABASE_URL.length > 0;
}

/**
 * The public URL of an object.
 *
 * Built by hand rather than round-tripping through `getPublicUrl`, which needs
 * a client instance for what is a string template. `next.config.ts` already
 * allows this host pattern for the image optimiser.
 */
export function publicUrl(bucket: BucketName, path: string): string {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encoded}`;
}

export interface UploadResult {
  ok: boolean;
  url?: string;
  path?: string;
  error?: string;
}

interface UploadOptions {
  bucket: BucketName;
  path: string;
  body: ArrayBuffer | Uint8Array | Blob;
  contentType: string;
  /** Service role for the unattended pipeline; session for a signed-in editor. */
  as: "service" | "session";
  upsert?: boolean;
}

export async function uploadImage(options: UploadOptions): Promise<UploadResult> {
  const supabase =
    options.as === "service" ? createServiceSupabase() : await createServerSupabase();

  if (!supabase) {
    return {
      ok: false,
      error:
        options.as === "service"
          ? "Storage needs SUPABASE_SECRET_KEY"
          : "Supabase is not configured",
    };
  }

  const { error } = await supabase.storage.from(options.bucket).upload(options.path, options.body, {
    contentType: options.contentType,
    upsert: options.upsert ?? false,
    cacheControl: "31536000",
  });

  if (error) {
    // The message from storage is the useful one — "Bucket not found" tells an
    // editor to run migration 0007, and a generic failure string would not.
    return { ok: false, error: error.message };
  }

  return { ok: true, path: options.path, url: publicUrl(options.bucket, options.path) };
}

export async function removeImage(
  bucket: BucketName,
  path: string,
  as: "service" | "session" = "session",
): Promise<{ ok: boolean; error?: string }> {
  const supabase = as === "service" ? createServiceSupabase() : await createServerSupabase();
  if (!supabase) return { ok: false, error: "Supabase is not configured" };

  const { error } = await supabase.storage.from(bucket).remove([path]);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export interface BucketStatus {
  name: BucketName;
  exists: boolean;
  objects: number | null;
  error?: string;
}

/**
 * What actually exists in the project, for the Media page.
 *
 * The admin used to assert that storage was not connected, which stopped being
 * true the moment someone ran the migration. Asking is cheap and honest.
 */
export async function listBucketStatus(): Promise<BucketStatus[] | null> {
  const supabase = createServiceSupabase();
  if (!supabase) return null;

  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) return null;

  const present = new Set((buckets ?? []).map((bucket) => bucket.name));

  return Promise.all(
    ALL_BUCKETS.map(async (name) => {
      if (!present.has(name)) return { name, exists: false, objects: null };

      // A flat listing of the bucket root plus one level is enough to say
      // whether anything is in there; this is a status line, not a file browser.
      const { data, error: listError } = await supabase.storage
        .from(name)
        .list("", { limit: 1000 });

      if (listError) return { name, exists: true, objects: null, error: listError.message };
      return { name, exists: true, objects: data?.length ?? 0 };
    }),
  );
}
