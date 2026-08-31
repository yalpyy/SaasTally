"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { toolInputSchema, type ToolInput } from "@/lib/validation/tool";
import type { AdminFormState } from "@/lib/admin/form-types";

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
