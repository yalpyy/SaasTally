"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  prepareForm,
  text,
  duplicateSlugFailure,
  saveFailure,
  UNIQUE_VIOLATION,
  type AdminFormState,
  type SupabaseClient,
} from "@/lib/admin/form-state";
import { bestListInputSchema, type BestListInput } from "@/lib/validation/best-list";

export type BestListFormState = AdminFormState;

function readForm(formData: FormData) {
  return {
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    description: text(formData, "description"),
    intro: text(formData, "intro"),
    categoryId: text(formData, "categoryId"),
    entries: text(formData, "entries"),
    status: text(formData, "status"),
    publishedAt: text(formData, "publishedAt"),
  };
}

function toRow(input: BestListInput) {
  return {
    title: input.title,
    slug: input.slug,
    description: input.description,
    intro: input.intro,
    category_id: input.categoryId,
    status: input.status,
    published_at: input.publishedAt,
  };
}

/**
 * Turn the slugs the editor typed into tool ids, refusing the whole save if
 * any of them is unknown.
 *
 * Silently dropping a typo would publish a shortlist quietly missing an entry,
 * which is the kind of thing nobody notices until a reader does.
 */
async function resolveTools(
  supabase: SupabaseClient,
  input: BestListInput,
  raw: AdminFormState["values"],
): Promise<{ ok: true; ids: string[] } | { ok: false; failure: AdminFormState }> {
  const slugs = input.entries.map((entry) => entry.toolSlug);
  if (slugs.length === 0) return { ok: true, ids: [] };

  const { data, error } = await supabase.from("tools").select("id, slug").in("slug", slugs);

  if (error || !data) {
    return {
      ok: false,
      failure: { status: "error", message: "Could not load tools.", values: raw },
    };
  }

  const bySlug = new Map((data as { id: string; slug: string }[]).map((t) => [t.slug, t.id]));
  const missing = slugs.filter((slug) => !bySlug.has(slug));

  if (missing.length > 0) {
    return {
      ok: false,
      failure: {
        status: "error",
        message: "Some entries do not match a tool.",
        fieldErrors: {
          entries: [`No tool with slug: ${missing.join(", ")}`],
        },
        values: raw,
      },
    };
  }

  return { ok: true, ids: slugs.map((slug) => bySlug.get(slug)!) };
}

/** Replace the entries wholesale — simpler and safer than diffing positions. */
async function writeItems(
  supabase: SupabaseClient,
  listId: string,
  input: BestListInput,
  toolIds: string[],
): Promise<boolean> {
  const { error: clearError } = await supabase
    .from("best_list_items")
    .delete()
    .eq("best_list_id", listId);

  if (clearError) return false;
  if (toolIds.length === 0) return true;

  const { error } = await supabase.from("best_list_items").insert(
    toolIds.map((toolId, index) => ({
      best_list_id: listId,
      tool_id: toolId,
      position: index,
      blurb: input.entries[index].blurb,
    })),
  );

  return !error;
}

function refresh(slug: string) {
  revalidatePath("/admin/best");
  revalidatePath("/best");
  revalidatePath(`/best/${slug}`);
}

export async function createBestListAction(
  _prevState: BestListFormState,
  formData: FormData,
): Promise<BestListFormState> {
  const prepared = await prepareForm(bestListInputSchema, readForm(formData));
  if (!prepared.ok) return prepared.failure;

  const { supabase, input, raw } = prepared;

  const resolved = await resolveTools(supabase, input, raw);
  if (!resolved.ok) return resolved.failure;

  const { data: inserted, error } = await supabase
    .from("best_lists")
    .insert(toRow(input))
    .select("id")
    .single();

  if (error || !inserted) {
    if (error?.code === UNIQUE_VIOLATION) return duplicateSlugFailure(input.slug, raw);
    return saveFailure("list", raw);
  }

  const listId = (inserted as { id: string }).id;

  if (!(await writeItems(supabase, listId, input, resolved.ids))) {
    return {
      status: "error",
      message:
        "The list was saved but its tools were not. Open it and set the entries again.",
      values: raw,
    };
  }

  refresh(input.slug);
  redirect("/admin/best");
}

export async function updateBestListAction(
  _prevState: BestListFormState,
  formData: FormData,
): Promise<BestListFormState> {
  const id = text(formData, "id");
  if (!id) {
    return { status: "error", message: "Missing list id. Reload the page and try again." };
  }

  const prepared = await prepareForm(bestListInputSchema, readForm(formData));
  if (!prepared.ok) return prepared.failure;

  const { supabase, input, raw } = prepared;

  const resolved = await resolveTools(supabase, input, raw);
  if (!resolved.ok) return resolved.failure;

  const { data: existing } = await supabase
    .from("best_lists")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const previousSlug = (existing as { slug: string } | null)?.slug;

  const { error } = await supabase.from("best_lists").update(toRow(input)).eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return duplicateSlugFailure(input.slug, raw);
    return saveFailure("list", raw);
  }

  if (!(await writeItems(supabase, id, input, resolved.ids))) {
    return {
      status: "error",
      message: "The list was saved but its tools were not. Set the entries again.",
      values: raw,
    };
  }

  refresh(input.slug);
  if (previousSlug && previousSlug !== input.slug) {
    revalidatePath(`/best/${previousSlug}`);
  }

  redirect("/admin/best");
}
