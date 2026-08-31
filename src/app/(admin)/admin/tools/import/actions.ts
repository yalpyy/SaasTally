"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { parseToolImport } from "@/lib/validation/tool-import";
import type { ImportState } from "./state";

/**
 * Bulk import.
 *
 * Deliberately not built on `prepareForm`: that shape validates one record and
 * reports field errors, while this one reports per-line problems across many.
 * The authorisation and connection steps are the same, though — a Server
 * Action is a public endpoint whatever it does.
 *
 * The state type and its initial value live in `./state`, because this file is
 * `"use server"` and may only export async functions.
 */

/**
 * Import, with anything unexpected reported on screen.
 *
 * Every failure the action anticipates already returns a message. This catches
 * the ones it does not — a missing column, a policy that rejects the write, a
 * migration nobody ran — because the alternative is the generic error page and
 * a reference number, which tells the person pasting fifty rows nothing at all.
 */
export async function importToolsAction(
  prevState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  try {
    return await runImport(formData);
  } catch (error) {
    // redirect() and notFound() work by throwing; rethrow so they still work.
    if (error && typeof error === "object" && "digest" in error) throw error;

    const message = error instanceof Error ? error.message : "Unknown error";
    const text = typeof formData.get("text") === "string" ? (formData.get("text") as string) : "";

    return {
      status: "error",
      message: `Import failed: ${message}`,
      text: text || prevState.text,
    };
  }
}

async function runImport(formData: FormData): Promise<ImportState> {
  await requireStaff();

  const text = typeof formData.get("text") === "string" ? (formData.get("text") as string) : "";

  if (!text.trim()) {
    return { status: "error", message: "Paste at least one line.", text };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Supabase is not configured, so nothing can be imported.",
      text,
    };
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return { status: "error", message: "Could not reach the database.", text };
  }

  const { data: categoryRows, error: categoryError } = await supabase
    .from("categories")
    .select("id, slug");

  if (categoryError || !categoryRows) {
    return {
      status: "error",
      message: `Could not load categories: ${categoryError?.message ?? "no rows returned"}`,
      text,
    };
  }

  const categories = categoryRows as { id: string; slug: string }[];

  if (categories.length === 0) {
    return {
      status: "error",
      message:
        "There are no categories yet. Run supabase/seed/0001_categories.sql first — every tool needs one.",
      text,
    };
  }

  const categoryIdBySlug = new Map(categories.map((row) => [row.slug, row.id]));
  const parsed = parseToolImport(
    text,
    categories.map((row) => row.slug),
  );

  // All or nothing on parse errors. A partial import leaves someone diffing a
  // fifty-line paste against the catalogue to work out what landed.
  if (parsed.errors.length > 0) {
    return {
      status: "error",
      message: `${parsed.errors.length} line${parsed.errors.length === 1 ? "" : "s"} need fixing. Nothing was imported.`,
      text,
      lineErrors: parsed.errors,
    };
  }

  if (parsed.rows.length === 0) {
    return { status: "error", message: "No usable lines found.", text };
  }

  // Slugs already in the catalogue are skipped rather than treated as errors:
  // re-pasting a list to add the three new entries is a normal thing to do.
  const { data: existingRows } = await supabase
    .from("tools")
    .select("slug")
    .in(
      "slug",
      parsed.rows.map((row) => row.slug),
    );

  const existing = new Set(((existingRows ?? []) as { slug: string }[]).map((row) => row.slug));
  const fresh = parsed.rows.filter((row) => !existing.has(row.slug));
  const skipped = parsed.rows.filter((row) => existing.has(row.slug)).map((row) => row.slug);

  if (fresh.length === 0) {
    return {
      status: "done",
      message: "Every tool in that list already exists.",
      created: 0,
      skipped,
    };
  }

  /**
   * Imported tools are created inactive.
   *
   * A row with a name and a URL and nothing else is not something a reader
   * should find. It becomes visible when someone has filled in what the page
   * actually says — which is the same rule the rest of the admin follows.
   */
  const { data: inserted, error: insertError } = await supabase
    .from("tools")
    .insert(
      fresh.map((row) => ({
        name: row.name,
        slug: row.slug,
        website_url: row.websiteUrl,
        short_description: "",
        pricing_model: "subscription",
        featured: false,
        active: false,
      })),
    )
    .select("id, slug");

  if (insertError || !inserted) {
    return {
      status: "error",
      message: insertError
        ? `Could not create the tools: ${insertError.message}`
        : "Could not create the tools. Check your permissions and try again.",
      text,
    };
  }

  const idBySlug = new Map((inserted as { id: string; slug: string }[]).map((r) => [r.slug, r.id]));

  const links = fresh.flatMap((row) => {
    const toolId = idBySlug.get(row.slug);
    if (!toolId) return [];
    return row.categorySlugs.flatMap((slug) => {
      const categoryId = categoryIdBySlug.get(slug);
      return categoryId ? [{ tool_id: toolId, category_id: categoryId }] : [];
    });
  });

  const warnings: string[] = [];

  if (links.length > 0) {
    const { error: linkError } = await supabase.from("tool_categories").insert(links);
    if (linkError) warnings.push(`categories not linked (${linkError.message})`);
  }

  /**
   * Every imported tool gets a watched source, not just the ones with a
   * pricing URL.
   *
   * Without this an import produced rows the pipeline had no way to reach:
   * nothing to fetch, so nothing to describe, so nothing ever published. The
   * homepage is enough to start from — it carries the vendor's own
   * description, and the fetch handler follows its navigation to find the
   * pricing page.
   */
  const sources = fresh.flatMap((row) => {
    const toolId = idBySlug.get(row.slug);
    if (!toolId) return [];

    return [
      row.pricingUrl
        ? { tool_id: toolId, url: row.pricingUrl, kind: "vendor_pricing" }
        : { tool_id: toolId, url: row.websiteUrl, kind: "vendor_page" },
    ];
  });

  let sourcesQueued = 0;
  if (sources.length > 0) {
    const { error: sourceError } = await supabase.from("content_sources").insert(sources);
    if (sourceError) {
      // Most likely migration 0005 has not been run. The tools still exist, so
      // say what is missing rather than failing the whole import.
      warnings.push(`sources not registered (${sourceError.message})`);
    } else {
      sourcesQueued = sources.length;
    }
  }

  revalidatePath("/admin/tools");
  revalidatePath("/admin/sources");

  return {
    status: "done",
    message:
      `Imported ${fresh.length} tool${fresh.length === 1 ? "" : "s"} as drafts.` +
      (warnings.length > 0 ? ` Warnings: ${warnings.join("; ")}.` : ""),
    created: fresh.length,
    skipped,
    sourcesQueued,
  };
}
