"use client";

import { useActionState } from "react";
import {
  createBestListAction,
  updateBestListAction,
  initialBestListFormState,
  type BestListFormState,
} from "@/app/(admin)/admin/best/actions";
import {
  Field,
  Fieldset,
  FormError,
  SubmitRow,
  inputClass,
  useSlugPair,
} from "@/components/admin/form-primitives";
import { contentStatuses } from "@/lib/validation/common";

export interface BestListFormValues {
  id: string;
  title: string;
  slug: string;
  description: string;
  intro: string;
  categoryId: string;
  entries: string;
  status: string;
  publishedAt: string;
}

export interface CategoryChoice {
  id: string;
  name: string;
}

const statusLabels: Record<(typeof contentStatuses)[number], string> = {
  draft: "Draft — not visible to anyone",
  scheduled: "Scheduled",
  published: "Published — live on the site",
  archived: "Archived",
};

export function BestListForm({
  categories,
  list,
}: {
  categories: CategoryChoice[];
  list?: BestListFormValues;
}) {
  const isEdit = Boolean(list);

  const [state, formAction, isPending] = useActionState<BestListFormState, FormData>(
    isEdit ? updateBestListAction : createBestListAction,
    initialBestListFormState,
  );

  const errors = state.fieldErrors ?? {};
  const submitted = state.values;

  function initial(field: keyof BestListFormValues): string {
    const attempted = submitted?.[field];
    if (typeof attempted === "string") return attempted;
    const saved = list?.[field];
    return typeof saved === "string" ? saved : "";
  }

  const title = useSlugPair(initial("title"), initial("slug"), isEdit);

  return (
    <form action={formAction} className="space-y-8">
      {isEdit ? <input type="hidden" name="id" value={list!.id} /> : null}

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
            placeholder="Best SEO Tools"
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
              : "Becomes the URL: /best/your-slug"
          }
        >
          <input
            id="slug"
            name="slug"
            value={title.slug}
            onChange={(event) => title.onSlugChange(event.target.value)}
            required
            className={inputClass}
            placeholder="seo-tools"
          />
        </Field>

        <Field
          label="Description"
          name="description"
          error={errors.description}
          hint="One line, shown under the heading and in search results."
        >
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={initial("description")}
            className={inputClass}
          />
        </Field>

        <Field
          label="Category"
          name="categoryId"
          error={errors.categoryId}
          hint="Optional — a cross-category shortlist belongs to no one category."
        >
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={initial("categoryId")}
            className={inputClass}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Intro"
          name="intro"
          error={errors.intro}
          hint="State the criteria before the conclusion — what earns a place on this list."
        >
          <textarea
            id="intro"
            name="intro"
            rows={5}
            defaultValue={initial("intro")}
            className={inputClass}
          />
        </Field>
      </Fieldset>

      <Fieldset
        title="The shortlist"
        description="One tool per line, in the order they should appear. Position is an editorial judgement — commission rate is not an input to it and is not readable from this screen."
      >
        <Field
          label="Entries"
          name="entries"
          error={errors.entries}
          hint="tool-slug | why it earns this spot. The blurb is optional; the order is the ranking."
        >
          <textarea
            id="entries"
            name="entries"
            rows={8}
            defaultValue={initial("entries")}
            className={`${inputClass} font-mono text-xs`}
            placeholder={"semrush | The deepest keyword database, if you can justify the price.\nahrefs | Better backlink data, simpler pricing."}
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
        label={isEdit ? "Save changes" : "Create list"}
        cancelHref="/admin/best"
        pending={isPending}
      />
    </form>
  );
}
