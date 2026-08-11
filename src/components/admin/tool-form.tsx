"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  createToolAction,
  updateToolAction,
  initialToolFormState,
  type ToolFormState,
} from "@/app/(admin)/admin/tools/actions";
import { pricingModels, suggestSlug } from "@/lib/validation/tool";
import type { Category } from "@/types";

/**
 * Form-ready values. Declared here rather than imported from the service so
 * this client component never reaches into a `server-only` module.
 */
export interface ToolFormValues {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string;
  shortDescription: string;
  description: string;
  bestFor: string;
  companyName: string;
  startingPrice: string;
  verdict: string;
  seoTitle: string;
  seoDescription: string;
  pricingModel: string;
  rating: string;
  foundedYear: string;
  features: string;
  pros: string;
  cons: string;
  featured: boolean;
  active: boolean;
  categorySlugs: string[];
}

const pricingLabels: Record<(typeof pricingModels)[number], string> = {
  free: "Free",
  freemium: "Freemium",
  subscription: "Subscription",
  "one-time": "One-time",
  "usage-based": "Usage-based",
  custom: "Custom pricing",
};

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-subtle focus:border-border-strong";

export function ToolForm({
  categories,
  tool,
}: {
  categories: Category[];
  /** Present in edit mode, absent when creating. */
  tool?: ToolFormValues;
}) {
  const isEdit = Boolean(tool);

  const [state, formAction, isPending] = useActionState<ToolFormState, FormData>(
    isEdit ? updateToolAction : createToolAction,
    initialToolFormState,
  );

  // Name and slug are controlled so the slug can follow the name. React keeps
  // this state across failed submits, so nothing is lost on a validation error.
  const [name, setName] = useState(tool?.name ?? "");
  const [slug, setSlug] = useState(tool?.slug ?? "");
  // Never auto-rewrite the slug of a published tool — that would break its URL.
  const [slugLocked, setSlugLocked] = useState(isEdit);

  const errors = state.fieldErrors ?? {};
  const submitted = state.values;

  /** Prefer what the editor just typed, then the saved value, then blank. */
  function initial(field: keyof ToolFormValues): string {
    const attempted = submitted?.[field];
    if (typeof attempted === "string") return attempted;
    const saved = tool?.[field];
    return typeof saved === "string" ? saved : "";
  }

  function initialBool(field: "featured" | "active", fallback: boolean): boolean {
    if (submitted) return Boolean(submitted[field]);
    if (tool) return tool[field];
    return fallback;
  }

  const selectedCategories: string[] = Array.isArray(submitted?.categorySlugs)
    ? (submitted.categorySlugs as string[])
    : (tool?.categorySlugs ?? []);

  return (
    <form action={formAction} className="space-y-8">
      {isEdit ? <input type="hidden" name="id" value={tool!.id} /> : null}

      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="flex gap-3 rounded-card border border-danger/30 bg-danger/5 p-4 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          <p className="leading-relaxed text-muted">{state.message}</p>
        </div>
      ) : null}

      <Fieldset title="Basics" description="What the tool is and where it lives.">
        <Field label="Name" name="name" error={errors.name} required>
          <input
            id="name"
            name="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!slugLocked) setSlug(suggestSlug(event.target.value));
            }}
            required
            className={inputClass}
            placeholder="Semrush"
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
              : "Becomes the URL: /tools/your-slug"
          }
        >
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugLocked(true);
              setSlug(event.target.value);
            }}
            required
            className={inputClass}
            placeholder="semrush"
          />
        </Field>

        <Field label="Website URL" name="websiteUrl" error={errors.websiteUrl} required>
          <input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            required
            defaultValue={initial("websiteUrl")}
            className={inputClass}
            placeholder="https://www.example.com"
          />
        </Field>

        <Field
          label="Short description"
          name="shortDescription"
          error={errors.shortDescription}
          required
          hint="One line, under 160 characters. Shown on every card."
        >
          <input
            id="shortDescription"
            name="shortDescription"
            required
            maxLength={160}
            defaultValue={initial("shortDescription")}
            className={inputClass}
            placeholder="SEO & competitive research"
          />
        </Field>

        <Field
          label="Overview"
          name="description"
          error={errors.description}
          hint="A few paragraphs. Say what it does and who it suits."
        >
          <textarea
            id="description"
            name="description"
            rows={6}
            defaultValue={initial("description")}
            className={inputClass}
          />
        </Field>
      </Fieldset>

      <Fieldset
        title="Categories"
        description="Drives navigation, filtering and the homepage grid."
      >
        {errors.categorySlugs ? <FieldError messages={errors.categorySlugs} /> : null}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3.5 py-2.5 text-sm transition-colors hover:bg-card-hover"
            >
              <input
                type="checkbox"
                name="categorySlugs"
                value={category.slug}
                defaultChecked={selectedCategories.includes(category.slug)}
                className="size-4 accent-[var(--primary)]"
              />
              {category.name}
            </label>
          ))}
        </div>
      </Fieldset>

      <Fieldset title="Positioning" description="How the tool is presented and priced.">
        <Field label="Best for" name="bestFor" error={errors.bestFor} hint="e.g. SEO teams">
          <input
            id="bestFor"
            name="bestFor"
            maxLength={80}
            defaultValue={initial("bestFor")}
            className={inputClass}
          />
        </Field>

        <Field
          label="Starting price"
          name="startingPrice"
          error={errors.startingPrice}
          hint="Free text, e.g. “From $139/mo”. Confirm with the vendor before publishing."
        >
          <input
            id="startingPrice"
            name="startingPrice"
            defaultValue={initial("startingPrice")}
            className={inputClass}
          />
        </Field>

        <Field label="Pricing model" name="pricingModel" error={errors.pricingModel} required>
          <select
            id="pricingModel"
            name="pricingModel"
            defaultValue={initial("pricingModel") || "subscription"}
            className={inputClass}
          >
            {pricingModels.map((model) => (
              <option key={model} value={model}>
                {pricingLabels[model]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Editorial rating"
          name="rating"
          error={errors.rating}
          hint="0–5. Leave blank until you have actually assessed it — we never invent scores."
        >
          <input
            id="rating"
            name="rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            defaultValue={initial("rating")}
            className={inputClass}
          />
        </Field>

        <Field label="Company" name="companyName" error={errors.companyName}>
          <input
            id="companyName"
            name="companyName"
            defaultValue={initial("companyName")}
            className={inputClass}
          />
        </Field>

        <Field label="Founded" name="foundedYear" error={errors.foundedYear}>
          <input
            id="foundedYear"
            name="foundedYear"
            type="number"
            min="1970"
            max="2100"
            defaultValue={initial("foundedYear")}
            className={inputClass}
          />
        </Field>
      </Fieldset>

      <Fieldset title="Editorial" description="One item per line.">
        <Field label="Key features" name="features" error={errors.features}>
          <textarea
            id="features"
            name="features"
            rows={6}
            defaultValue={initial("features")}
            className={inputClass}
            placeholder={"Keyword research\nRank tracking\nSite audits"}
          />
        </Field>

        <Field label="Pros" name="pros" error={errors.pros}>
          <textarea
            id="pros"
            name="pros"
            rows={4}
            defaultValue={initial("pros")}
            className={inputClass}
          />
        </Field>

        <Field
          label="Cons"
          name="cons"
          error={errors.cons}
          hint="Say who it is not for. This is what makes the page trustworthy."
        >
          <textarea
            id="cons"
            name="cons"
            rows={4}
            defaultValue={initial("cons")}
            className={inputClass}
          />
        </Field>

        <Field label="SaaSTally verdict" name="verdict" error={errors.verdict}>
          <textarea
            id="verdict"
            name="verdict"
            rows={3}
            defaultValue={initial("verdict")}
            className={inputClass}
          />
        </Field>
      </Fieldset>

      <Fieldset title="SEO" description="Optional. Falls back to sensible defaults when blank.">
        <Field label="SEO title" name="seoTitle" error={errors.seoTitle}>
          <input
            id="seoTitle"
            name="seoTitle"
            maxLength={70}
            defaultValue={initial("seoTitle")}
            className={inputClass}
          />
        </Field>

        <Field label="SEO description" name="seoDescription" error={errors.seoDescription}>
          <textarea
            id="seoDescription"
            name="seoDescription"
            rows={2}
            maxLength={160}
            defaultValue={initial("seoDescription")}
            className={inputClass}
          />
        </Field>
      </Fieldset>

      <Fieldset title="Visibility">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={initialBool("active", true)}
            className="size-4 accent-[var(--primary)]"
          />
          <span>
            Active
            <span className="ml-2 text-xs text-subtle">Visible on the public site</span>
          </span>
        </label>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={initialBool("featured", false)}
            className="size-4 accent-[var(--primary)]"
          />
          <span>
            Featured
            <span className="ml-2 text-xs text-subtle">Eligible for the homepage</span>
          </span>
        </label>
      </Fieldset>

      <div className="flex items-center gap-3 border-t border-border pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {isEdit ? "Save changes" : "Save tool"}
        </button>
        <Link
          href="/admin/tools"
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
      {error ? <FieldError messages={error} /> : null}
    </div>
  );
}

function FieldError({ messages }: { messages: string[] }) {
  return (
    <p className="mt-2 text-xs text-danger" role="alert">
      {messages.join(". ")}
    </p>
  );
}
