"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  createProgramAction,
  updateProgramAction,
  initialProgramFormState,
  type ProgramFormState,
} from "@/app/(admin)/admin/affiliate/actions";
import { commissionTypes, affiliateStatuses } from "@/lib/validation/affiliate-program";

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

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-subtle focus:border-border-strong";

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

      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="flex gap-3 rounded-card border border-danger/30 bg-danger/5 p-4 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          <p className="leading-relaxed text-muted">{state.message}</p>
        </div>
      ) : null}

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

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {isEdit ? "Save changes" : "Create program"}
        </button>

        <Link
          href="/admin/affiliate"
          className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-medium transition-colors hover:bg-card-hover"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------------- */
/* Local building blocks — nothing else uses them, so they stay in this file. */
/* ------------------------------------------------------------------------- */

function Fieldset({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-card border border-border bg-card p-6">
      <legend className="px-2 text-sm font-semibold">{title}</legend>
      {description ? <p className="mb-5 mt-1 text-sm text-muted">{description}</p> : null}
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  name,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  error?: string[];
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required ? (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {hint ? <p className="mb-2 mt-1 text-xs text-subtle">{hint}</p> : <div className="mt-2" />}
      {children}
      {error ? (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error.join(". ")}
        </p>
      ) : null}
    </div>
  );
}
