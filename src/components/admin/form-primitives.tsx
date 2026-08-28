"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";
import { suggestSlug } from "@/lib/validation/common";

/**
 * The pieces every admin editor is built from.
 *
 * They live here rather than in each form so five content types cannot end up
 * with five slightly different labels, error colours and focus rings.
 */

export const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-subtle focus:border-border-strong";

export function Fieldset({
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

export function Field({
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

/** Exported separately for the few controls that are not wrapped in a Field. */
export function FieldError({ messages }: { messages: string[] }) {
  return (
    <p className="mt-2 text-xs text-danger" role="alert">
      {messages.join(". ")}
    </p>
  );
}

/** The banner above a form that failed to save. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex gap-3 rounded-card border border-danger/30 bg-danger/5 p-4 text-sm"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
      <p className="leading-relaxed text-muted">{message}</p>
    </div>
  );
}

export function SubmitRow({
  label,
  cancelHref,
  pending,
}: {
  label: string;
  cancelHref: string;
  pending: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {label}
      </button>

      <Link
        href={cancelHref}
        className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-medium transition-colors hover:bg-card-hover"
      >
        Cancel
      </Link>
    </div>
  );
}

/**
 * Title and slug, kept together.
 *
 * The slug follows the title while a record is new, and stops the moment the
 * editor touches it — or the record already exists, since changing a published
 * slug breaks every link pointing at it. Controlled state also means a failed
 * submit does not lose what was typed.
 */
export function useSlugPair(initialTitle: string, initialSlug: string, isEdit: boolean) {
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [locked, setLocked] = useState(isEdit);

  return {
    title,
    slug,
    onTitleChange(value: string) {
      setTitle(value);
      if (!locked) setSlug(suggestSlug(value));
    },
    onSlugChange(value: string) {
      setLocked(true);
      setSlug(value);
    },
  };
}
