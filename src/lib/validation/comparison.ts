import { z } from "zod";
import { optionalText, publishedAtField, requiredText, slugField, statusField } from "./common";

/**
 * Comparison input.
 *
 * The attribute table is collected as pipe-separated rows:
 *
 *   Backlink index | 43 trillion links | 35 trillion links | a
 *
 * label | value for A | value for B | winner (a, b or tie). One line per row is
 * what the rendered table already is, and it is paste-able from a spreadsheet,
 * which is where this kind of research usually starts.
 */
const WINNERS = ["a", "b", "tie"] as const;

export const attributesField = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
  )
  .superRefine((lines, ctx) => {
    for (const line of lines) {
      const parts = line.split("|").map((part) => part.trim());
      if (parts.length !== 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${line}" needs four parts: label | A | B | winner`,
        });
        continue;
      }
      if (!parts[0]) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Every row needs a label" });
      }
      if (!(WINNERS as readonly string[]).includes(parts[3].toLowerCase())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${parts[3]}" should be a, b or tie`,
        });
      }
    }
  })
  .transform((lines) =>
    lines.flatMap((line) => {
      const parts = line.split("|").map((part) => part.trim());
      if (parts.length !== 4) return [];
      return [
        {
          label: parts[0],
          a: parts[1],
          b: parts[2],
          winner: parts[3].toLowerCase() as (typeof WINNERS)[number],
        },
      ];
    }),
  );

export const comparisonInputSchema = z
  .object({
    title: requiredText(5, 160, "Title"),
    slug: slugField,

    toolAId: z.string().uuid("Choose the first tool"),
    toolBId: z.string().uuid("Choose the second tool"),

    quickVerdict: optionalText(600),
    recommendation: optionalText(4000),
    attributes: attributesField,

    status: statusField,
    publishedAt: publishedAtField,
  })
  .refine((input) => input.toolAId !== input.toolBId, {
    message: "Choose two different tools",
    path: ["toolBId"],
  });

export type ComparisonInput = z.infer<typeof comparisonInputSchema>;
