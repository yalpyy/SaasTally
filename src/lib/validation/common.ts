import { z } from "zod";

/**
 * Validation pieces shared by every content editor.
 *
 * Runs on the **server**. The browser's `required` attributes are a
 * convenience for the person typing, not a control.
 */

/** Empty string from a form field means "not provided", not an empty value. */
export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Textareas collect list values one per line. */
export const linesToArray = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
  );

export const optionalText = (max: number) =>
  z
    .string()
    .default("")
    .transform(emptyToNull)
    .refine(
      (value) => value === null || value.length <= max,
      `Must be ${max} characters or fewer`,
    );

export const requiredText = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be ${max} characters or fewer`);

export const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug must be at least 2 characters")
  .max(80, "Slug must be 80 characters or fewer")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and hyphens only (e.g. google-analytics)",
  );

export const contentStatuses = ["draft", "scheduled", "published", "archived"] as const;

export const statusField = z.enum(contentStatuses, {
  errorMap: () => ({ message: "Choose a status" }),
});

/**
 * A publish date as `datetime-local` gives it. Blank is valid: a draft has no
 * publication date, and inventing `now()` for one would put a date on the page
 * before anyone decided to publish it.
 */
export const publishedAtField = z
  .string()
  .default("")
  .transform(emptyToNull)
  .refine(
    (value) => value === null || !Number.isNaN(Date.parse(value)),
    "Enter a valid date and time, or leave blank",
  )
  .transform((value) => (value === null ? null : new Date(value).toISOString()));

/** A score on the 0–10 editorial scale. Blank is valid — we never invent one. */
export const scoreField = z
  .string()
  .default("")
  .transform((value) => (value.trim() === "" ? null : Number(value)))
  .refine(
    (value) => value === null || (Number.isFinite(value) && value >= 0 && value <= 10),
    "Score must be a number between 0 and 10, or left blank",
  );

/** Suggest a slug from a title, so editors rarely have to type one. */
export function suggestSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
