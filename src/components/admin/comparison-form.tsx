"use client";

import { useActionState } from "react";
import {
  createComparisonAction,
  updateComparisonAction,
  initialComparisonFormState,
  type ComparisonFormState,
} from "@/app/(admin)/admin/comparisons/actions";
import {
  Field,
  Fieldset,
  FormError,
  SubmitRow,
  inputClass,
  useSlugPair,
} from "@/components/admin/form-primitives";
import { contentStatuses } from "@/lib/validation/common";

export interface ComparisonFormValues {
  id: string;
  title: string;
  slug: string;
  toolAId: string;
  toolBId: string;
  quickVerdict: string;
  recommendation: string;
  attributes: string;
  status: string;
  publishedAt: string;
}

export interface ToolChoice {
  id: string;
  name: string;
}

const statusLabels: Record<(typeof contentStatuses)[number], string> = {
  draft: "Draft — not visible to anyone",
  scheduled: "Scheduled",
  published: "Published — live on the site",
  archived: "Archived",
};

export function ComparisonForm({
  tools,
  comparison,
}: {
  tools: ToolChoice[];
  comparison?: ComparisonFormValues;
}) {
  const isEdit = Boolean(comparison);

  const [state, formAction, isPending] = useActionState<ComparisonFormState, FormData>(
    isEdit ? updateComparisonAction : createComparisonAction,
    initialComparisonFormState,
  );

  const errors = state.fieldErrors ?? {};
  const submitted = state.values;

  function initial(field: keyof ComparisonFormValues): string {
    const attempted = submitted?.[field];
    if (typeof attempted === "string") return attempted;
    const saved = comparison?.[field];
    return typeof saved === "string" ? saved : "";
  }

  const title = useSlugPair(initial("title"), initial("slug"), isEdit);

  return (
    <form action={formAction} className="space-y-8">
      {isEdit ? <input type="hidden" name="id" value={comparison!.id} /> : null}

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
            placeholder="Semrush vs Ahrefs"
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
              : "Becomes the URL: /compare/your-slug"
          }
        >
          <input
            id="slug"
            name="slug"
            value={title.slug}
            onChange={(event) => title.onSlugChange(event.target.value)}
            required
            className={inputClass}
            placeholder="semrush-vs-ahrefs"
          />
        </Field>
      </Fieldset>

      <Fieldset
        title="The two tools"
        description="A comparison is exactly two sides. Which one is A decides which column each value lands in below."
      >
        <Field label="Tool A" name="toolAId" error={errors.toolAId} required>
          <select
            id="toolAId"
            name="toolAId"
            defaultValue={initial("toolAId")}
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

        <Field label="Tool B" name="toolBId" error={errors.toolBId} required>
          <select
            id="toolBId"
            name="toolBId"
            defaultValue={initial("toolBId")}
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
      </Fieldset>

      <Fieldset
        title="Attribute table"
        description="One row per attribute. A tie is a real answer — use it rather than picking a side to look decisive."
      >
        <Field
          label="Rows"
          name="attributes"
          error={errors.attributes}
          hint="label | value for A | value for B | winner (a, b or tie)"
        >
          <textarea
            id="attributes"
            name="attributes"
            rows={10}
            defaultValue={initial("attributes")}
            className={`${inputClass} font-mono text-xs`}
            placeholder={
              "Backlink index | 43 trillion | 35 trillion | a\nStarting price | $139/mo | $129/mo | b\nLearning curve | Steep | Steep | tie"
            }
          />
        </Field>
      </Fieldset>

      <Fieldset title="Verdict">
        <Field label="Quick verdict" name="quickVerdict" error={errors.quickVerdict}>
          <textarea
            id="quickVerdict"
            name="quickVerdict"
            rows={3}
            defaultValue={initial("quickVerdict")}
            className={inputClass}
          />
        </Field>

        <Field
          label="Recommendation"
          name="recommendation"
          error={errors.recommendation}
          hint="Say who each tool is for, and who it is not for."
        >
          <textarea
            id="recommendation"
            name="recommendation"
            rows={6}
            defaultValue={initial("recommendation")}
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
        label={isEdit ? "Save changes" : "Create comparison"}
        cancelHref="/admin/comparisons"
        pending={isPending}
      />
    </form>
  );
}
