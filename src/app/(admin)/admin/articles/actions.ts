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
} from "@/lib/admin/form-state";
import {
  articleInputSchema,
  estimateReadingMinutes,
  type ArticleInput,
} from "@/lib/validation/article";

export type ArticleFormState = AdminFormState;

function readForm(formData: FormData) {
  return {
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    excerpt: text(formData, "excerpt"),
    content: text(formData, "content"),
    featuredImage: text(formData, "featuredImage"),
    authorId: text(formData, "authorId"),
    categorySlug: text(formData, "categorySlug"),
    readingMinutes: text(formData, "readingMinutes"),
    seoTitle: text(formData, "seoTitle"),
    seoDescription: text(formData, "seoDescription"),
    canonicalUrl: text(formData, "canonicalUrl"),
    status: text(formData, "status"),
    publishedAt: text(formData, "publishedAt"),
  };
}

function toRow(input: ArticleInput) {
  return {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    content: input.content,
    featured_image: input.featuredImage,
    author_id: input.authorId,
    category_slug: input.categorySlug,
    // Left blank, it is measured from the body — a hand-typed figure stops
    // matching the article the first time anyone edits it.
    reading_minutes: input.readingMinutes ?? estimateReadingMinutes(input.content ?? ""),
    seo_title: input.seoTitle,
    seo_description: input.seoDescription,
    canonical_url: input.canonicalUrl,
    status: input.status,
    published_at: input.publishedAt,
  };
}

function refresh(slug: string) {
  revalidatePath("/admin/articles");
  revalidatePath("/articles");
  revalidatePath(`/articles/${slug}`);
  // The homepage carries the latest articles.
  revalidatePath("/");
}

export async function createArticleAction(
  _prevState: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  const prepared = await prepareForm(articleInputSchema, readForm(formData));
  if (!prepared.ok) return prepared.failure;

  const { supabase, input, raw } = prepared;

  const { error } = await supabase.from("articles").insert(toRow(input));

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return duplicateSlugFailure(input.slug, raw);
    return saveFailure("article", raw);
  }

  refresh(input.slug);
  redirect("/admin/articles");
}

export async function updateArticleAction(
  _prevState: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  const id = text(formData, "id");
  if (!id) {
    return { status: "error", message: "Missing article id. Reload the page and try again." };
  }

  const prepared = await prepareForm(articleInputSchema, readForm(formData));
  if (!prepared.ok) return prepared.failure;

  const { supabase, input, raw } = prepared;

  const { data: existing } = await supabase
    .from("articles")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const previousSlug = (existing as { slug: string } | null)?.slug;

  const { error } = await supabase.from("articles").update(toRow(input)).eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return duplicateSlugFailure(input.slug, raw);
    return saveFailure("article", raw);
  }

  refresh(input.slug);
  if (previousSlug && previousSlug !== input.slug) {
    revalidatePath(`/articles/${previousSlug}`);
  }

  redirect("/admin/articles");
}
