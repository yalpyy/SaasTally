import { z } from "zod";
import { optionalText, publishedAtField, requiredText, slugField, statusField } from "./common";

/**
 * Article input.
 *
 * The body is the small Markdown subset `src/lib/utils/markdown.tsx` renders,
 * stored as plain text. Swapping that for MDX later is a renderer change, not
 * a schema change.
 */
export const articleInputSchema = z.object({
  title: requiredText(5, 160, "Title"),
  slug: slugField,

  excerpt: optionalText(300),
  content: optionalText(60000),
  featuredImage: optionalText(500),

  /** Free text rather than an authors row: articles predate that table. */
  authorName: optionalText(120),
  categorySlug: optionalText(80),

  /**
   * Blank means "work it out from the body". A number typed by hand tends to
   * stop matching the article the first time anyone edits it.
   */
  readingMinutes: z
    .string()
    .default("")
    .transform((value) => value.trim())
    .refine((value) => value === "" || /^\d{1,3}$/.test(value), "Enter a whole number of minutes")
    .transform((value) => (value === "" ? null : Number(value))),

  seoTitle: optionalText(70),
  seoDescription: optionalText(160),
  canonicalUrl: optionalText(500),

  status: statusField,
  publishedAt: publishedAtField,
});

export type ArticleInput = z.infer<typeof articleInputSchema>;

/** Roughly 200 words a minute, floored at one. */
export function estimateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
