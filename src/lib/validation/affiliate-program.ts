import { z } from "zod";

/**
 * Input validation for the affiliate program editor.
 *
 * Commercial data, and the only place in the codebase where commission values
 * are accepted at all. They are stored and displayed to admins; nothing here
 * feeds ranking, scoring or ordering.
 */

export const commissionTypes = ["percentage", "flat", "hybrid"] as const;
export const affiliateStatuses = ["active", "paused", "pending"] as const;

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const optionalText = (max: number) =>
  z
    .string()
    .default("")
    .transform(emptyToNull)
    .refine(
      (value) => value === null || value.length <= max,
      `Must be ${max} characters or fewer`,
    );

/**
 * The destination must be an absolute http(s) URL.
 *
 * This is the string the /go redirect eventually hands to `Location`, so a
 * `javascript:` or relative value would turn our own redirect into someone
 * else's payload. Checked here rather than at redirect time because the
 * database is the trust boundary worth guarding.
 */
const httpUrl = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .max(2000, "URL must be 2000 characters or fewer")
    .refine((value) => {
      try {
        const { protocol } = new URL(value);
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    }, "Enter a full URL starting with http:// or https://");

export const affiliateProgramInputSchema = z.object({
  toolId: z.string().uuid("Choose a tool"),

  affiliateUrl: httpUrl("Affiliate URL is required"),

  network: optionalText(80),
  programName: optionalText(120),

  commissionType: z.enum(commissionTypes, {
    errorMap: () => ({ message: "Choose a commission type" }),
  }),

  /**
   * Free text on purpose: real programs are quoted as "30%", "$200" or
   * "20% + $50 bonus". Storing the vendor's own wording beats forcing it into
   * a number we would only ever display back.
   */
  commissionValue: optionalText(80),

  cookieDays: z
    .string()
    .default("")
    .transform((value) => value.trim())
    .refine((value) => value === "" || /^\d{1,3}$/.test(value), "Enter a whole number of days")
    .transform((value) => (value === "" ? null : Number(value)))
    .refine((value) => value === null || value <= 365, "365 days or fewer"),

  status: z.enum(affiliateStatuses, {
    errorMap: () => ({ message: "Choose a status" }),
  }),
});

export type AffiliateProgramInput = z.infer<typeof affiliateProgramInputSchema>;
