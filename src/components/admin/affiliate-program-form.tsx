"use client";

import { useActionState } from "react";
import {
  createProgramAction,
  updateProgramAction,
  initialProgramFormState,
  type ProgramFormState,
} from "@/app/(admin)/admin/affiliate/actions";
import { commissionTypes, affiliateStatuses } from "@/lib/validation/affiliate-program";
import { Field, Fieldset, FormError, SubmitRow, inputClass } from "@/components/admin/form-primitives";

/**
 * Form-ready values, declared here rather than imported from the service so
 * this client component never reaches into a `server-only` module.
 */
export interface ProgramFormValues {
  id: string;
  toolId: string;
  affiliateUrl: string;
  network: string;
  programName: string;
  commissionType: string;
  commissionValue: string;
  cookieDays: string;
  status: string;
}

export interface ToolChoice {
  id: string;
  name: string;
  slug: string;
}

const commissionLabels: Record<(typeof commissionTypes)[number], string> = {
  percentage: "Percentage of sale",
  flat: "Flat fee",
  hybrid: "Hybrid",
};

const statusLabels: Record<(typeof affiliateStatuses)[number], string> = {
  active: "Active — CTAs redirect through this link",
  paused: "Paused — CTAs fall back to the vendor site",
  pending: "Pending — application not approved yet",
};

export function AffiliateProgramForm({
  tools,
  program,
}: {
  tools: ToolChoice[];
  /** Present in edit mode, absent when creating. */
  program?: ProgramFormValues;
}) {
  const isEdit = Boolean(program);

  const [state, formAction, isPending] = useActionState<ProgramFormState, FormData>(
    isEdit ? updateProgramAction : createProgramAction,
    initialProgramFormState,
  );

  const errors = state.fieldErrors ?? {};
  const submitted = state.values;

  /** Prefer what the admin just typed, then the saved value, then blank. */
  function initial(field: keyof ProgramFormValues): string {
    const attempted = submitted?.[field];
    if (typeof attempted === "string") return attempted;
    const saved = program?.[field];
    return typeof saved === "string" ? saved : "";
  }

  return (
    <form action={formAction} className="space-y-8">
      {isEdit ? <input type="hidden" name="id" value={program!.id} /> : null}

      {state.status === "error" ? <FormError message={state.message} /> : null}

      <Fieldset
        title="Partnership"
        description="Which tool this program pays for, and where its CTAs should land."
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
                {tool.name} (/{tool.slug})
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Affiliate URL"
          name="affiliateUrl"
          error={errors.affiliateUrl}
          required
          hint="Never rendered into a page — /go/[slug] resolves it server-side and redirects."
        >
          <input
            id="affiliateUrl"
            name="affiliateUrl"
            type="url"
            defaultValue={initial("affiliateUrl")}
            required
            className={inputClass}
            placeholder="https://network.example.com/click?a=123"
          />
        </Field>

        <Field label="Network" name="network" error={errors.network}>
          <input
            id="network"
            name="network"
            defaultValue={initial("network")}
            className={inputClass}
            placeholder="Impact, PartnerStack, direct…"
          />
        </Field>

        <Field label="Program name" name="programName" error={errors.programName}>
          <input
            id="programName"
            name="programName"
            defaultValue={initial("programName")}
            className={inputClass}
            placeholder="Semrush Affiliate"
          />
        </Field>
      </Fieldset>

      <Fieldset
        title="Commercial terms"
        description="Recorded for reporting and contract reference. These values are never read by ranking, scoring or ordering code, and never leave the admin."
      >
        <Field label="Commission type" name="commissionType" error={errors.commissionType} required>
          <select
            id="commissionType"
            name="commissionType"
            defaultValue={initial("commissionType") || "percentage"}
            required
            className={inputClass}
          >
            {commissionTypes.map((type) => (
              <option key={type} value={type}>
                {commissionLabels[type]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Commission value"
          name="commissionValue"
          error={errors.commissionValue}
          hint="Free text, so the vendor's own wording survives: 30%, $200, 20% + $50 bonus."
        >
          <input
            id="commissionValue"
            name="commissionValue"
            defaultValue={initial("commissionValue")}
            className={inputClass}
            placeholder="30%"
          />
        </Field>

        <Field label="Cookie window (days)" name="cookieDays" error={errors.cookieDays}>
          <input
            id="cookieDays"
            name="cookieDays"
            inputMode="numeric"
            defaultValue={initial("cookieDays")}
            className={inputClass}
            placeholder="90"
          />
        </Field>
      </Fieldset>

      <Fieldset
        title="Status"
        description="Only one program per tool can be active. Pausing one is how you make room for another."
      >
        <Field label="Status" name="status" error={errors.status} required>
          <select
            id="status"
            name="status"
            defaultValue={initial("status") || "pending"}
            required
            className={inputClass}
          >
            {affiliateStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </Field>
      </Fieldset>

      <SubmitRow
        label={isEdit ? "Save changes" : "Create program"}
        cancelHref="/admin/affiliate"
        pending={isPending}
      />
    </form>
  );
}
