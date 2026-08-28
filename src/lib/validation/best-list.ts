import { z } from "zod";
import { optionalText, publishedAtField, requiredText, slugField, statusField } from "./common";

/**
 * Best-list input.
 *
 * Entries are collected as `tool-slug | why it earns this spot` lines. Order
 * is the order of the lines, which is the honest model: an editor ranking a
 * shortlist is reordering a list, not filling in position numbers.
 */
export const bestListEntriesField = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
  )
  .transform((lines) =>
    lines.map((line) => {
      const [slug, ...rest] = line.split("|");
      const blurb = rest.join("|").trim();
      return { toolSlug: slug.trim().toLowerCase(), blurb: blurb.length > 0 ? blurb : null };
    }),
  )
  .superRefine((entries, ctx) => {
    const seen = new Set<string>();

    for (const entry of entries) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.toolSlug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${entry.toolSlug}" is not a valid tool slug`,
        });
      }
      if (seen.has(entry.toolSlug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${entry.toolSlug}" appears twice — a tool can hold only one position`,
        });
      }
      seen.add(entry.toolSlug);
    }
  });

export const bestListInputSchema = z.object({
  title: requiredText(5, 160, "Title"),
  slug: slugField,
  description: optionalText(300),
  intro: optionalText(4000),

  /** Blank is allowed: a cross-category shortlist belongs to no one category. */
  categoryId: z
    .string()
    .default("")
    .transform((value) => (value.trim() === "" ? null : value.trim()))
    .refine(
      (value) => value === null || z.string().uuid().safeParse(value).success,
      "Choose a category, or leave it unset",
    ),

  entries: bestListEntriesField,

  status: statusField,
  publishedAt: publishedAtField,
});

export type BestListInput = z.infer<typeof bestListInputSchema>;
