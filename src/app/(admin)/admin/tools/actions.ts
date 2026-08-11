"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { toolInputSchema } from "@/lib/validation/tool";

export interface ToolFormState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** Echoed back so a failed submit does not wipe what the editor typed. */
  values?: Record<string, string | string[] | boolean>;
}

export const initialToolFormState: ToolFormState = { status: "idle" };

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function checkbox(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

/**
 * Creates a tool.
 *
 * Three things worth noting:
 *
 * 1. `requireStaff()` runs first. A Server Action is a public HTTP endpoint —
 *    anyone can invoke it. Hiding the form is not authorisation.
 * 2. The write goes through the **session** client, so Postgres RLS re-checks
 *    the caller's role. Authorisation is enforced twice, on purpose.
 * 3. Nothing is faked in mock mode. Without Supabase we say so and stop.
 */
export async function createToolAction(
  _prevState: ToolFormState,
  formData: FormData,
): Promise<ToolFormState> {
  await requireStaff();

  const raw = {
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

  const parsed = toolInputSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      values: raw,
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Supabase is not configured, so nothing can be saved. Add the environment variables and try again.",
      values: raw,
    };
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return { status: "error", message: "Could not reach the database.", values: raw };
  }

  const input = parsed.data;

  // Resolve category slugs to ids before writing anything, so we never create
  // a tool that ends up with no categories attached.
  const { data: categoryRows, error: categoryError } = await supabase
    .from("categories")
    .select("id, slug")
    .in("slug", input.categorySlugs);

  if (categoryError) {
    return { status: "error", message: "Could not load categories.", values: raw };
  }

  const categories = (categoryRows ?? []) as { id: string; slug: string }[];

  if (categories.length !== input.categorySlugs.length) {
    return {
      status: "error",
      message: "One of the selected categories no longer exists. Reload and try again.",
      values: raw,
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("tools")
    .insert({
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
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    // 23505 is Postgres' unique_violation — almost always a duplicate slug.
    const isDuplicate = insertError?.code === "23505";
    return {
      status: "error",
      message: isDuplicate
        ? `The slug "${input.slug}" is already taken. Choose a different one.`
        : "Could not save the tool. Check your permissions and try again.",
      fieldErrors: isDuplicate ? { slug: ["This slug is already in use"] } : undefined,
      values: raw,
    };
  }

  const toolId = (inserted as { id: string }).id;

  const { error: linkError } = await supabase.from("tool_categories").insert(
    categories.map((category) => ({ tool_id: toolId, category_id: category.id })),
  );

  if (linkError) {
    return {
      status: "error",
      message:
        "The tool was saved but its categories were not linked. Open it and set the categories again.",
      values: raw,
    };
  }

  revalidatePath("/admin/tools");
  revalidatePath("/software");
  revalidatePath(`/tools/${input.slug}`);
  for (const slug of input.categorySlugs) {
    revalidatePath(`/categories/${slug}`);
  }

  // redirect() throws internally, so it must stay outside any try/catch.
  redirect("/admin/tools");
}
