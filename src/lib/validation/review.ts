import { z } from "zod";
import {
  linesToArray,
  optionalText,
  publishedAtField,
  requiredText,
  scoreField,
  slugField,
  statusField,
} from "./common";

/**
 * Review input.
 *
 * The breakdown is collected as `Label: 8.5` lines rather than a repeating
 * field group: editors think in a short list of criteria, and one textarea
 * they can paste into beats eight inputs they have to tab through.
 */
const criterionLine = /^(.+?):\s*(\d{1,2}(?:\.\d)?)$/;

export const breakdownField = z
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
      const match = criterionLine.exec(line);
      if (!match) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${line}" should look like "Ease of use: 8.5"`,
        });
        continue;
      }
      const score = Number(match[2]);
      if (score < 0 || score > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${match[1].trim()}" must score between 0 and 10`,
        });
      }
    }
  })
  .transform((lines) =>
    lines.flatMap((line) => {
      const match = criterionLine.exec(line);
      return match ? [{ label: match[1].trim(), score: Number(match[2]) }] : [];
    }),
  );

export const reviewInputSchema = z.object({
  toolId: z.string().uuid("Choose the tool this review covers"),
  title: requiredText(5, 160, "Title"),
  slug: slugField,

  quickVerdict: optionalText(600),
  score: scoreField,
  breakdown: breakdownField,

  likes: linesToArray,
  improvements: linesToArray,

  featuresBody: optionalText(8000),
  pricingBody: optionalText(8000),
  experienceBody: optionalText(8000),
  audienceBody: optionalText(8000),
  finalVerdict: optionalText(4000),

  /** Blank means the house byline rather than a named person. */
  authorId: z
    .string()
    .default("")
    .transform((value) => (value.trim() === "" ? null : value.trim()))
    .refine(
      (value) => value === null || z.string().uuid().safeParse(value).success,
      "Choose an author, or leave it as the house byline",
    ),

  status: statusField,
  publishedAt: publishedAtField,
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;
