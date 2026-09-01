"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { toolInputSchema, type ToolInput } from "@/lib/validation/tool";
import type { AdminFormState, UploadFormState } from "@/lib/admin/form-types";
import { BUCKETS, removeImage, uploadImage } from "@/lib/storage";

/**
 * A "use server" file may only export async functions, so the state shape is a
 * type alias (erased at compile time) and the initial value lives in
 * `lib/admin/form-types`. Exporting the constant from here made the module
 * throw on load and took the whole page down with it.
 */
export type ToolFormState = AdminFormState;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function checkbox(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

function readForm(formData: FormData) {
  return {
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    websiteUrl: text(formData, "websiteUrl"),
    shortDescription: text(formData, "shortDescription"),
    description: text(formData, "description"),
    bestFor: text(formData, "bestFor"),
    companyName: text(formData, "companyName"),
    startingPrice: text(formData, "startingPrice"),
    verdict: text(formData, "verdict"),
    seoTitle: text(formData, "seoTitle"),
    seoDescription: text(formData, "seoDescription"),
    pricingModel: text(formData, "pricingModel"),
    rating: text(formData, "rating"),
    foundedYear: text(formData, "foundedYear"),
    features: text(formData, "features"),
    pros: text(formData, "pros"),
    cons: text(formData, "cons"),
    featured: checkbox(formData, "featured"),
    active: checkbox(formData, "active"),
    categorySlugs: formData.getAll("categorySlugs").map(String),
  };
}

/** Maps validated input onto database column names. */
function toRow(input: ToolInput) {
  return {
    name: input.name,
    slug: input.slug,
    website_url: input.websiteUrl,
    short_description: input.shortDescription,
    description: input.description,
    best_for: input.bestFor,
    company_name: input.companyName,
    starting_price: input.startingPrice,
    pricing_model: input.pricingModel,
    rating: input.rating,
    founded_year: input.foundedYear,
    features: input.features,
    pros: input.pros,
    cons: input.cons,
    verdict: input.verdict,
    seo_title: input.seoTitle,
    seo_description: input.seoDescription,
    featured: input.featured,
    active: input.active,
    // Saving through the editor is what "reviewed" means: it clears the notice
    // on the public page and stops the pipeline from rewriting the prose.
    human_reviewed: true,
  };
}

function refreshPublicPages(slug: string, categorySlugs: string[]) {
  revalidatePath("/admin/tools");
  revalidatePath("/software");
  revalidatePath("/");
  revalidatePath(`/tools/${slug}`);
  for (const categorySlug of categorySlugs) {
    revalidatePath(`/categories/${categorySlug}`);
  }
}

/**
 * Shared prologue for both actions.
 *
 * `requireStaff()` runs first because a Server Action is a public HTTP
 * endpoint — anyone can invoke it, so hiding the form is not authorisation.
 * The write then goes through the **session** client, meaning Postgres RLS
 * re-checks the caller's role. Two independent gates, deliberately.
 */
type PrepareResult =
  | { ok: false; failure: ToolFormState }
  | {
      ok: true;
      supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;
      input: ToolInput;
      categories: { id: string; slug: string }[];
      raw: ToolFormState["values"];
    };

async function prepare(formData: FormData): Promise<PrepareResult> {
  await requireStaff();

  const raw = readForm(formData);
  const parsed = toolInputSchema.safeParse(raw);

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

  const { data: categoryRows, error: categoryError } = await supabase
    .from("categories")
    .select("id, slug")
    .in("slug", parsed.data.categorySlugs);

  if (categoryError) {
    return {
      ok: false,
      failure: { status: "error", message: "Could not load categories.", values: raw },
    };
  }

  const categories = (categoryRows ?? []) as { id: string; slug: string }[];

  if (categories.length !== parsed.data.categorySlugs.length) {
    return {
      ok: false,
      failure: {
        status: "error",
        message: "One of the selected categories no longer exists. Reload and try again.",
        values: raw,
      },
    };
  }

  return { ok: true, supabase, input: parsed.data, categories, raw };
}

function duplicateSlugFailure(slug: string, raw: ToolFormState["values"]): ToolFormState {
  return {
    status: "error",
    message: `The slug "${slug}" is already taken. Choose a different one.`,
    fieldErrors: { slug: ["This slug is already in use"] },
    values: raw,
  };
}

export async function createToolAction(
  _prevState: ToolFormState,
  formData: FormData,
): Promise<ToolFormState> {
  const prepared = await prepare(formData);
  if (!prepared.ok) return prepared.failure;

  const { supabase, input, categories, raw } = prepared;

  const { data: inserted, error } = await supabase
    .from("tools")
    .insert(toRow(input))
    .select("id")
    .single();

  if (error || !inserted) {
    // 23505 is Postgres' unique_violation — almost always a duplicate slug.
    if (error?.code === "23505") return duplicateSlugFailure(input.slug, raw);
    return {
      status: "error",
      message: "Could not save the tool. Check your permissions and try again.",
      values: raw,
    };
  }

  const toolId = (inserted as { id: string }).id;

  const { error: linkError } = await supabase
    .from("tool_categories")
    .insert(categories.map((category) => ({ tool_id: toolId, category_id: category.id })));

  if (linkError) {
    return {
      status: "error",
      message:
        "The tool was saved but its categories were not linked. Open it and set the categories again.",
      values: raw,
    };
  }

  refreshPublicPages(input.slug, input.categorySlugs);

  // redirect() throws internally, so it must stay outside any try/catch.
  redirect("/admin/tools");
}

export async function updateToolAction(
  _prevState: ToolFormState,
  formData: FormData,
): Promise<ToolFormState> {
  const id = text(formData, "id");
  if (!id) {
    return { status: "error", message: "Missing tool id. Reload the page and try again." };
  }

  const prepared = await prepare(formData);
  if (!prepared.ok) return prepared.failure;

  const { supabase, input, categories, raw } = prepared;

  // Capture the previous slug so its old public URL is revalidated too.
  const { data: existing } = await supabase.from("tools").select("slug").eq("id", id).maybeSingle();
  const previousSlug = (existing as { slug: string } | null)?.slug;

  const { error } = await supabase.from("tools").update(toRow(input)).eq("id", id);

  if (error) {
    if (error.code === "23505") return duplicateSlugFailure(input.slug, raw);
    return {
      status: "error",
      message: "Could not update the tool. Check your permissions and try again.",
      values: raw,
    };
  }

  // Replace the category links wholesale — simpler and safer than diffing.
  const { error: clearError } = await supabase.from("tool_categories").delete().eq("tool_id", id);

  if (!clearError) {
    await supabase
      .from("tool_categories")
      .insert(categories.map((category) => ({ tool_id: id, category_id: category.id })));
  }

  refreshPublicPages(input.slug, input.categorySlugs);
  if (previousSlug && previousSlug !== input.slug) {
    revalidatePath(`/tools/${previousSlug}`);
  }

  redirect("/admin/tools");
}

/* ------------------------------------------------------------------------- */
/* Screenshots                                                                */
/* ------------------------------------------------------------------------- */

/**
 * Screenshots are the one image on a tool page that a person has to supply.
 *
 * A logo can be collected — it is the vendor's own mark, used to identify
 * their product, and carries no claim. A screenshot does carry one: this is
 * what the product looks like, today, in the state someone actually saw. The
 * pipeline never writes these, and there is no automated path that could.
 *
 * Uploads go through the **session** client so the storage policies added in
 * migration 0007 re-check `is_staff()`. Nothing here uses the service role.
 */

export type ScreenshotFormState = UploadFormState;

/** Matches the bucket's allowed types in migration 0007. */
const SCREENSHOT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024;

/** Enough to show a product; past this a tool page is a slideshow. */
const MAX_SCREENSHOTS = 8;

interface StoredScreenshot {
  path: string;
  url: string;
  caption: string | null;
}

async function loadScreenshots(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>,
  toolId: string,
): Promise<{ slug: string; screenshots: StoredScreenshot[] } | null> {
  const { data, error } = await supabase
    .from("tools")
    .select("slug, screenshots")
    .eq("id", toolId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as { slug: string; screenshots: StoredScreenshot[] | null };
  return { slug: row.slug, screenshots: row.screenshots ?? [] };
}

export async function uploadToolScreenshotAction(
  _prev: ScreenshotFormState,
  formData: FormData,
): Promise<ScreenshotFormState> {
  await requireStaff();

  const toolId = text(formData, "toolId");
  if (!toolId) return { status: "error", message: "Missing tool" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose an image to upload" };
  }

  const extension = SCREENSHOT_TYPES[file.type.toLowerCase()];
  if (!extension) {
    return { status: "error", message: "Screenshots must be PNG, JPEG or WebP" };
  }

  if (file.size > MAX_SCREENSHOT_BYTES) {
    return { status: "error", message: "That file is over 8 MB — resize it first" };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { status: "error", message: "Supabase is not configured" };

  const current = await loadScreenshots(supabase, toolId);
  if (!current) return { status: "error", message: "Tool not found" };

  if (current.screenshots.length >= MAX_SCREENSHOTS) {
    return { status: "error", message: `A tool can have ${MAX_SCREENSHOTS} screenshots` };
  }

  // Namespaced by tool and made unique, so re-uploading the same filename
  // twice adds a second image rather than silently replacing the first.
  const path = `${toolId}/${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;

  const upload = await uploadImage({
    bucket: BUCKETS.toolScreenshots,
    path,
    body: await file.arrayBuffer(),
    contentType: file.type,
    as: "session",
  });

  if (!upload.ok || !upload.url) {
    return { status: "error", message: upload.error ?? "Upload failed" };
  }

  const caption = text(formData, "caption").trim().slice(0, 200);

  const next = [...current.screenshots, { path, url: upload.url, caption: caption || null }];

  const { error } = await supabase.from("tools").update({ screenshots: next }).eq("id", toolId);

  if (error) {
    // The row is the record; an object nothing points at is litter.
    await removeImage(BUCKETS.toolScreenshots, path, "session");
    return { status: "error", message: error.message };
  }

  revalidatePath(`/admin/tools/${toolId}/edit`);
  revalidatePath(`/tools/${current.slug}`);

  return { status: "done", message: "Screenshot added" };
}

export async function removeToolScreenshotAction(
  _prev: ScreenshotFormState,
  formData: FormData,
): Promise<ScreenshotFormState> {
  await requireStaff();

  const toolId = text(formData, "toolId");
  const path = text(formData, "path");
  if (!toolId || !path) return { status: "error", message: "Missing screenshot" };

  const supabase = await createServerSupabase();
  if (!supabase) return { status: "error", message: "Supabase is not configured" };

  const current = await loadScreenshots(supabase, toolId);
  if (!current) return { status: "error", message: "Tool not found" };

  const next = current.screenshots.filter((shot) => shot.path !== path);

  const { error } = await supabase.from("tools").update({ screenshots: next }).eq("id", toolId);
  if (error) return { status: "error", message: error.message };

  // Only after the row no longer points at it. The other order leaves a broken
  // image on the public page if this second call fails.
  await removeImage(BUCKETS.toolScreenshots, path, "session");

  revalidatePath(`/admin/tools/${toolId}/edit`);
  revalidatePath(`/tools/${current.slug}`);

  return { status: "done", message: "Screenshot removed" };
}
