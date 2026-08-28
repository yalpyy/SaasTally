import { z } from "zod";
import { scoreField } from "./common";

/**
 * Input validation for the tool editor.
 *
 * Lives outside the Server Action so the same rules can later be reused by an
 * import script or an API route. Validation runs on the **server** — the
 * browser's `required` attributes are a convenience, not a control.
 */

export const pricingModels = [
  "free",
  "freemium",
  "subscription",
  "one-time",
  "usage-based",
  "custom",
] as const;

/** Empty string from a form field means "not provided", not an empty value. */
function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Textareas collect list values one per line. */
const linesToArray = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
  );

const optionalText = (max: number) =>
  z.string().default("").transform(emptyToNull).refine(
    (value) => value === null || value.length <= max,
    `Must be ${max} characters or fewer`,
  );

export const toolInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be 80 characters or fewer"),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug must be at least 2 characters")
    .max(80, "Slug must be 80 characters or fewer")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers and hyphens only (e.g. google-analytics)",
    ),

  websiteUrl: z
    .string()
    .trim()
    .url("Enter a full URL including https://"),

  shortDescription: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters — this appears on every card")
    .max(160, "Keep this under 160 characters so cards stay tidy"),

  description: optionalText(6000),
  bestFor: optionalText(80),
  companyName: optionalText(120),
  startingPrice: optionalText(60),
  verdict: optionalText(2000),
  seoTitle: optionalText(70),
  seoDescription: optionalText(160),

  pricingModel: z.enum(pricingModels),

  /**
   * Editorial score out of 10, the same scale as a review's. Blank is valid —
   * we never invent a rating.
   */
  rating: scoreField,

  foundedYear: z
    .string()
    .default("")
    .transform((value) => (value.trim() === "" ? null : Number(value)))
    .refine(
      (value) => value === null || (Number.isInteger(value) && value >= 1970 && value <= 2100),
      "Enter a year between 1970 and 2100, or leave blank",
    ),

  features: linesToArray,
  pros: linesToArray,
  cons: linesToArray,

  featured: z.boolean().default(false),
  active: z.boolean().default(true),

  categorySlugs: z
    .array(z.string().trim().min(1))
    .min(1, "Choose at least one category"),
});

export type ToolInput = z.infer<typeof toolInputSchema>;

/** Suggest a slug from a name, so editors rarely have to type one. */
export function suggestSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
