"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  prepareForm,
  text,
  duplicateSlugFailure,
  saveFailure,
  UNIQUE_VIOLATION,
  initialAdminFormState,
  type AdminFormState,
} from "@/lib/admin/form-state";
import { comparisonInputSchema, type ComparisonInput } from "@/lib/validation/comparison";

export type ComparisonFormState = AdminFormState;
export const initialComparisonFormState = initialAdminFormState;

function readForm(formData: FormData) {
  return {
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    toolAId: text(formData, "toolAId"),
    toolBId: text(formData, "toolBId"),
    quickVerdict: text(formData, "quickVerdict"),
    recommendation: text(formData, "recommendation"),
    attributes: text(formData, "attributes"),
    status: text(formData, "status"),
    publishedAt: text(formData, "publishedAt"),
  };
}

function toRow(input: ComparisonInput) {
  return {
    title: input.title,
    slug: input.slug,
    tool_a_id: input.toolAId,
    tool_b_id: input.toolBId,
    quick_verdict: input.quickVerdict,
    recommendation: input.recommendation,
    attributes: input.attributes,
    status: input.status,
    published_at: input.publishedAt,
  };
}

function refresh(slug: string) {
  revalidatePath("/admin/comparisons");
  revalidatePath("/compare");
  revalidatePath(`/compare/${slug}`);
}

export async function createComparisonAction(
  _prevState: ComparisonFormState,
  formData: FormData,
): Promise<ComparisonFormState> {
  const prepared = await prepareForm(comparisonInputSchema, readForm(formData));
  if (!prepared.ok) return prepared.failure;

  const { supabase, input, raw } = prepared;

  const { error } = await supabase.from("comparisons").insert(toRow(input));

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return duplicateSlugFailure(input.slug, raw);
    return saveFailure("comparison", raw);
  }

  refresh(input.slug);
  redirect("/admin/comparisons");
}

export async function updateComparisonAction(
  _prevState: ComparisonFormState,
  formData: FormData,
): Promise<ComparisonFormState> {
  const id = text(formData, "id");
  if (!id) {
    return { status: "error", message: "Missing comparison id. Reload the page and try again." };
  }

  const prepared = await prepareForm(comparisonInputSchema, readForm(formData));
  if (!prepared.ok) return prepared.failure;

  const { supabase, input, raw } = prepared;

  const { data: existing } = await supabase
    .from("comparisons")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const previousSlug = (existing as { slug: string } | null)?.slug;

  const { error } = await supabase.from("comparisons").update(toRow(input)).eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return duplicateSlugFailure(input.slug, raw);
    return saveFailure("comparison", raw);
  }

  refresh(input.slug);
  if (previousSlug && previousSlug !== input.slug) {
    revalidatePath(`/compare/${previousSlug}`);
  }

  redirect("/admin/comparisons");
}
