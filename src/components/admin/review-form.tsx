"use client";

import { useActionState } from "react";
import {
  createReviewAction,
  updateReviewAction,
  initialReviewFormState,
  type ReviewFormState,
} from "@/app/(admin)/admin/reviews/actions";
import {
  Field,
  Fieldset,
  FormError,
  SubmitRow,
  inputClass,
  useSlugPair,
} from "@/components/admin/form-primitives";
import { contentStatuses } from "@/lib/validation/common";

export interface ReviewFormValues {
  id: string;
  toolId: string;
  title: string;
  slug: string;
  quickVerdict: string;
  score: string;
  breakdown: string;
  likes: string;
  improvements: string;
  featuresBody: string;
  pricingBody: string;
  experienceBody: string;
  audienceBody: string;
  finalVerdict: string;
  authorId: string;
  status: string;
  publishedAt: string;
}

export interface Choice {
  id: string;
  name: string;
}

const statusLabels: Record<(typeof contentStatuses)[number], string> = {
  draft: "Draft — not visible to anyone",
  scheduled: "Scheduled",
  published: "Published — live on the site",
  archived: "Archived",
};

export function ReviewForm({
  tools,
  authors,
  review,
}: {
  tools: Choice[];
  authors: Choice[];
  review?: ReviewFormValues;
}) {
  const isEdit = Boolean(review);

  const [state, formAction, isPending] = useActionState<ReviewFormState, FormData>(
    isEdit ? updateReviewAction : createReviewAction,
    initialReviewFormState,
  );

  const errors = state.fieldErrors ?? {};
  const submitted = state.values;

  function initial(field: keyof ReviewFormValues): string {
    const attempted = submitted?.[field];
    if (typeof attempted === "string") return attempted;
    const saved = review?.[field];
    return typeof saved === "string" ? saved : "";
  }

  const title = useSlugPair(initial("title"), initial("slug"), isEdit);

  return (
    <form action={formAction} className="space-y-8">
      {isEdit ? <input type="hidden" name="id" value={review!.id} /> : null}

      {state.status === "error" ? <FormError message={state.message} /> : null}

      <Fieldset title="Basics" description="What is being reviewed, and where it lives.">
        <Field label="Tool" name="toolId" error={errors.toolId} required>
          <select
            id="toolId"
            name="toolId"
            defaultValue={initial("toolId")}
            required
            className={inputClass}
          >
            <option value="">Choose a tool…</option>
            {tools.map((tool) => (
              <option key={tool.id} value={tool.id}>
                {tool.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Title" name="title" error={errors.title} required>
          <input
            id="title"
            name="title"
            value={title.title}
            onChange={(event) => title.onTitleChange(event.target.value)}
            required
            className={inputClass}
            placeholder="Semrush Review: Is It Worth It in 2026?"
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
              : "Becomes the URL: /reviews/your-slug"
          }
        >
          <input
            id="slug"
            name="slug"
            value={title.slug}
            onChange={(event) => title.onSlugChange(event.target.value)}
            required
            className={inputClass}
            placeholder="semrush-review"
          />
        </Field>

        <Field
          label="Author"
          name="authorId"
          error={errors.authorId}
          hint="Leave blank for the house byline. A named author is credited as a person in structured data, so only pick one who actually wrote it."
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
        title="Verdict and scoring"
        description="Scores are out of 10. Leave the overall score blank rather than inventing one."
      >
        <Field label="Quick verdict" name="quickVerdict" error={errors.quickVerdict}>
          <textarea
            id="quickVerdict"
            name="quickVerdict"
            rows={3}
            defaultValue={initial("quickVerdict")}
            className={inputClass}
          />
        </Field>

        <Field label="Overall score" name="score" error={errors.score} hint="0–10, one decimal.">
          <input
            id="score"
            name="score"
            inputMode="decimal"
            defaultValue={initial("score")}
            className={inputClass}
            placeholder="9.4"
          />
        </Field>

        <Field
          label="Breakdown"
          name="breakdown"
          error={errors.breakdown}
          hint="One criterion per line, as Label: score — e.g. Ease of use: 8.5"
        >
          <textarea
            id="breakdown"
            name="breakdown"
            rows={5}
            defaultValue={initial("breakdown")}
            className={inputClass}
            placeholder={"Features: 9.4\nEase of use: 8.8\nValue: 8.5"}
          />
        </Field>

        <Field
          label="What we like"
          name="likes"
          error={errors.likes}
          hint="One per line."
        >
          <textarea
            id="likes"
            name="likes"
            rows={4}
            defaultValue={initial("likes")}
            className={inputClass}
          />
        </Field>

        <Field
          label="What could be better"
          name="improvements"
          error={errors.improvements}
          hint="One per line. Publishing who a tool is not for is the point of the section."
        >
          <textarea
            id="improvements"
            name="improvements"
            rows={4}
            defaultValue={initial("improvements")}
            className={inputClass}
          />
        </Field>
      </Fieldset>

      <Fieldset title="Body" description="The sections of the review, in the order they appear.">
        <Field label="Features" name="featuresBody" error={errors.featuresBody}>
          <textarea
            id="featuresBody"
            name="featuresBody"
            rows={6}
            defaultValue={initial("featuresBody")}
            className={inputClass}
          />
        </Field>

        <Field
          label="Pricing"
          name="pricingBody"
          error={errors.pricingBody}
          hint="Confirm figures with the vendor before publishing, and label anything unverified."
        >
          <textarea
            id="pricingBody"
            name="pricingBody"
            rows={6}
            defaultValue={initial("pricingBody")}
            className={inputClass}
          />
        </Field>

        <Field
          label="User experience"
          name="experienceBody"
          error={errors.experienceBody}
          hint="Never claim hands-on testing unless the author actually tested it."
        >
          <textarea
            id="experienceBody"
            name="experienceBody"
            rows={6}
            defaultValue={initial("experienceBody")}
            className={inputClass}
          />
        </Field>

        <Field label="Who should use it" name="audienceBody" error={errors.audienceBody}>
          <textarea
            id="audienceBody"
            name="audienceBody"
            rows={6}
            defaultValue={initial("audienceBody")}
            className={inputClass}
          />
        </Field>

        <Field label="Final verdict" name="finalVerdict" error={errors.finalVerdict}>
          <textarea
            id="finalVerdict"
            name="finalVerdict"
            rows={4}
            defaultValue={initial("finalVerdict")}
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
          hint="Leave blank until it is actually published — a date on an unpublished draft is a claim we have not earned."
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
        label={isEdit ? "Save changes" : "Create review"}
        cancelHref="/admin/reviews"
        pending={isPending}
      />
    </form>
  );
}
