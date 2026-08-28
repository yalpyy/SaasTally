"use client";

import { useActionState } from "react";
import {
  createSourceAction,
  updateSourceAction,
  initialSourceFormState,
  type SourceFormState,
} from "@/app/(admin)/admin/sources/actions";
import {
  Field,
  Fieldset,
  FormError,
  SubmitRow,
  inputClass,
} from "@/components/admin/form-primitives";
import { sourceKinds } from "@/lib/validation/content-source";

export interface SourceFormValues {
  id: string;
  toolId: string;
  url: string;
  kind: string;
  refreshHours: string;
  active: boolean;
}

export interface ToolChoice {
  id: string;
  name: string;
}

const kindLabels: Record<(typeof sourceKinds)[number], string> = {
  vendor_pricing: "Vendor pricing page",
  vendor_page: "Vendor page (home, features, about)",
  affiliate_network: "Affiliate network listing",
};

export function SourceForm({
  tools,
  source,
}: {
  tools: ToolChoice[];
  source?: SourceFormValues;
}) {
  const isEdit = Boolean(source);

  const [state, formAction, isPending] = useActionState<SourceFormState, FormData>(
    isEdit ? updateSourceAction : createSourceAction,
    initialSourceFormState,
  );

  const errors = state.fieldErrors ?? {};
  const submitted = state.values;

  function initial(field: keyof SourceFormValues): string {
    const attempted = submitted?.[field];
    if (typeof attempted === "string") return attempted;
    const saved = source?.[field];
    return typeof saved === "string" ? saved : "";
  }

  function initialActive(): boolean {
    if (submitted) return Boolean(submitted.active);
    if (source) return source.active;
    return true;
  }

  return (
    <form action={formAction} className="space-y-8">
      {isEdit ? <input type="hidden" name="id" value={source!.id} /> : null}

      {state.status === "error" ? <FormError message={state.message} /> : null}

      <Fieldset
        title="Watched page"
        description="A page the pipeline re-reads on a schedule to notice when the facts on it change. We only keep a hash and a short excerpt — the page itself belongs to the vendor."
      >
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

        <Field
          label="URL"
          name="url"
          error={errors.url}
          required
          hint="The vendor's own page. robots.txt is checked before every fetch; if it says no, the source deactivates itself."
        >
          <input
            id="url"
            name="url"
            type="url"
            defaultValue={initial("url")}
            required
            className={inputClass}
            placeholder="https://www.semrush.com/prices/"
          />
        </Field>

        <Field label="What this page is" name="kind" error={errors.kind} required>
          <select
            id="kind"
            name="kind"
            defaultValue={initial("kind") || "vendor_pricing"}
            required
            className={inputClass}
          >
            {sourceKinds.map((kind) => (
              <option key={kind} value={kind}>
                {kindLabels[kind]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Re-check every (hours)"
          name="refreshHours"
          error={errors.refreshHours}
          hint="168 is weekly. Pricing pages change on the order of months — checking hourly is traffic taken from a vendor for nothing."
        >
          <input
            id="refreshHours"
            name="refreshHours"
            inputMode="numeric"
            defaultValue={initial("refreshHours") || "168"}
            className={inputClass}
          />
        </Field>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={initialActive()}
            className="size-4 rounded border-border"
          />
          <span>
            Active
            <span className="ml-2 text-xs text-subtle">Included in scheduled runs</span>
          </span>
        </label>
      </Fieldset>

      <SubmitRow
        label={isEdit ? "Save changes" : "Add source"}
        cancelHref="/admin/sources"
        pending={isPending}
      />
    </form>
  );
}
