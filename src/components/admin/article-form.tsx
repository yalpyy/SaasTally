"use client";

import { useActionState } from "react";
import {
  createArticleAction,
  updateArticleAction,
  initialArticleFormState,
  type ArticleFormState,
} from "@/app/(admin)/admin/articles/actions";
import {
  Field,
  Fieldset,
  FormError,
  SubmitRow,
  inputClass,
  useSlugPair,
} from "@/components/admin/form-primitives";
import { contentStatuses } from "@/lib/validation/common";
import type { Category } from "@/types";

export interface ArticleFormValues {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  authorId: string;
  categorySlug: string;
  readingMinutes: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  status: string;
  publishedAt: string;
}

const statusLabels: Record<(typeof contentStatuses)[number], string> = {
  draft: "Draft — not visible to anyone",
  scheduled: "Scheduled",
  published: "Published — live on the site",
  archived: "Archived",
};

export function ArticleForm({
  categories,
  authors,
  article,
}: {
  categories: Category[];
  authors: { id: string; name: string }[];
  article?: ArticleFormValues;
}) {
  const isEdit = Boolean(article);

  const [state, formAction, isPending] = useActionState<ArticleFormState, FormData>(
    isEdit ? updateArticleAction : createArticleAction,
    initialArticleFormState,
  );

  const errors = state.fieldErrors ?? {};
  const submitted = state.values;

  function initial(field: keyof ArticleFormValues): string {
    const attempted = submitted?.[field];
    if (typeof attempted === "string") return attempted;
    const saved = article?.[field];
    return typeof saved === "string" ? saved : "";
  }

  const title = useSlugPair(initial("title"), initial("slug"), isEdit);

  return (
    <form action={formAction} className="space-y-8">
      {isEdit ? <input type="hidden" name="id" value={article!.id} /> : null}

      {state.status === "error" ? <FormError message={state.message} /> : null}

      <Fieldset title="Basics">
        <Field label="Title" name="title" error={errors.title} required>
          <input
            id="title"
            name="title"
            value={title.title}
            onChange={(event) => title.onTitleChange(event.target.value)}
            required
            className={inputClass}
          />
        </Field>

        <Field
          label="Slug"
          name="slug"
          error={errors.slug}
          required
          hint={
            isEdit
              ? "Changing this changes the public URL and breaks existing links."
              : "Becomes the URL: /articles/your-slug"
          }
        >
          <input
            id="slug"
            name="slug"
            value={title.slug}
            onChange={(event) => title.onSlugChange(event.target.value)}
            required
            className={inputClass}
          />
        </Field>

        <Field
          label="Excerpt"
          name="excerpt"
          error={errors.excerpt}
          hint="Shown on cards and used as the meta description when no SEO description is set."
        >
          <textarea
            id="excerpt"
            name="excerpt"
            rows={3}
            defaultValue={initial("excerpt")}
            className={inputClass}
          />
        </Field>

        <Field label="Category" name="categorySlug" error={errors.categorySlug}>
          <select
            id="categorySlug"
            name="categorySlug"
            defaultValue={initial("categorySlug")}
            className={inputClass}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Author"
          name="authorId"
          error={errors.authorId}
          hint="Leave blank for the house byline. Named authors come from Authors, the same list reviews use."
        >
          <select
            id="authorId"
            name="authorId"
            defaultValue={initial("authorId")}
            className={inputClass}
          >
            <option value="">SaaSTally Editorial</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>
        </Field>
      </Fieldset>

      <Fieldset
        title="Body"
        description="Markdown subset: headings, lists, links, bold and italic."
      >
        <Field label="Content" name="content" error={errors.content}>
          <textarea
            id="content"
            name="content"
            rows={20}
            defaultValue={initial("content")}
            className={`${inputClass} font-mono text-xs`}
          />
        </Field>

        <Field
          label="Reading time (minutes)"
          name="readingMinutes"
          error={errors.readingMinutes}
          hint="Leave blank to measure it from the body."
        >
          <input
            id="readingMinutes"
            name="readingMinutes"
            inputMode="numeric"
            defaultValue={initial("readingMinutes")}
            className={inputClass}
          />
        </Field>

        <Field label="Featured image URL" name="featuredImage" error={errors.featuredImage}>
          <input
            id="featuredImage"
            name="featuredImage"
            defaultValue={initial("featuredImage")}
            className={inputClass}
          />
        </Field>
      </Fieldset>

      <Fieldset title="SEO" description="All optional — sensible defaults come from the fields above.">
        <Field label="SEO title" name="seoTitle" error={errors.seoTitle}>
          <input
            id="seoTitle"
            name="seoTitle"
            defaultValue={initial("seoTitle")}
            className={inputClass}
          />
        </Field>

        <Field label="SEO description" name="seoDescription" error={errors.seoDescription}>
          <textarea
            id="seoDescription"
            name="seoDescription"
            rows={2}
            defaultValue={initial("seoDescription")}
            className={inputClass}
          />
        </Field>

        <Field
          label="Canonical URL"
          name="canonicalUrl"
          error={errors.canonicalUrl}
          hint="Only when this article was published somewhere else first."
        >
          <input
            id="canonicalUrl"
            name="canonicalUrl"
            defaultValue={initial("canonicalUrl")}
            className={inputClass}
          />
        </Field>
      </Fieldset>

      <Fieldset title="Publication">
        <Field label="Status" name="status" error={errors.status} required>
          <select
            id="status"
            name="status"
            defaultValue={initial("status") || "draft"}
            required
            className={inputClass}
          >
            {contentStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Published at"
          name="publishedAt"
          error={errors.publishedAt}
          hint="Leave blank until it is actually published."
        >
          <input
            id="publishedAt"
            name="publishedAt"
            type="datetime-local"
            defaultValue={initial("publishedAt")}
            className={inputClass}
          />
        </Field>
      </Fieldset>

      <SubmitRow
        label={isEdit ? "Save changes" : "Create article"}
        cancelHref="/admin/articles"
        pending={isPending}
      />
    </form>
  );
}
