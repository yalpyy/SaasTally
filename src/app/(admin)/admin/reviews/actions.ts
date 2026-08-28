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
import { reviewInputSchema, type ReviewInput } from "@/lib/validation/review";

export type ReviewFormState = AdminFormState;
export const initialReviewFormState = initialAdminFormState;

function readForm(formData: FormData) {
  return {
    toolId: text(formData, "toolId"),
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    quickVerdict: text(formData, "quickVerdict"),
    score: text(formData, "score"),
    breakdown: text(formData, "breakdown"),
    likes: text(formData, "likes"),
    improvements: text(formData, "improvements"),
    featuresBody: text(formData, "featuresBody"),
    pricingBody: text(formData, "pricingBody"),
    experienceBody: text(formData, "experienceBody"),
    audienceBody: text(formData, "audienceBody"),
    finalVerdict: text(formData, "finalVerdict"),
    authorId: text(formData, "authorId"),
    status: text(formData, "status"),
    publishedAt: text(formData, "publishedAt"),
  };
}

function toRow(input: ReviewInput) {
  return {
    tool_id: input.toolId,
    title: input.title,
    slug: input.slug,
    quick_verdict: input.quickVerdict,
    score: input.score,
    breakdown: input.breakdown,
    likes: input.likes,
    improvements: input.improvements,
    features_body: input.featuresBody,
    pricing_body: input.pricingBody,
    experience_body: input.experienceBody,
    audience_body: input.audienceBody,
    final_verdict: input.finalVerdict,
    author_id: input.authorId,
    status: input.status,
    published_at: input.publishedAt,
  };
}

function refresh(slug: string) {
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidatePath(`/reviews/${slug}`);
}

export async function createReviewAction(
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const prepared = await prepareForm(reviewInputSchema, readForm(formData));
  if (!prepared.ok) return prepared.failure;

  const { supabase, input, raw } = prepared;

  const { error } = await supabase.from("reviews").insert(toRow(input));

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return duplicateSlugFailure(input.slug, raw);
    return saveFailure("review", raw);
  }

  refresh(input.slug);
  redirect("/admin/reviews");
}

export async function updateReviewAction(
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const id = text(formData, "id");
  if (!id) {
    return { status: "error", message: "Missing review id. Reload the page and try again." };
  }

  const prepared = await prepareForm(reviewInputSchema, readForm(formData));
  if (!prepared.ok) return prepared.failure;

  const { supabase, input, raw } = prepared;

  // Capture the previous slug so its old public URL is revalidated too.
  const { data: existing } = await supabase
    .from("reviews")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const previousSlug = (existing as { slug: string } | null)?.slug;

  const { error } = await supabase.from("reviews").update(toRow(input)).eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return duplicateSlugFailure(input.slug, raw);
    return saveFailure("review", raw);
  }

  refresh(input.slug);
  if (previousSlug && previousSlug !== input.slug) {
    revalidatePath(`/reviews/${previousSlug}`);
  }

  redirect("/admin/reviews");
}
