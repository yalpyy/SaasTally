import { z } from "zod";

/**
 * Input for a watched source URL.
 *
 * The URL check is stricter than the tool editor's: this one is handed to a
 * scheduled fetcher rather than to a person, so an unreachable scheme or a
 * relative path becomes a job that fails every night rather than a broken link
 * someone notices.
 */
export const sourceKinds = ["vendor_pricing", "vendor_page", "affiliate_network"] as const;

export const contentSourceInputSchema = z.object({
  toolId: z.string().uuid("Choose the tool this page belongs to"),

  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(2000, "URL must be 2000 characters or fewer")
    .refine((value) => {
      try {
        const { protocol } = new URL(value);
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    }, "Enter a full URL starting with http:// or https://"),

  kind: z.enum(sourceKinds, { errorMap: () => ({ message: "Choose what this page is" }) }),

  /**
   * How often to re-check. Weekly by default: pricing pages change on the
   * order of months, and checking one hourly is traffic we take from a vendor
   * for nothing.
   */
  refreshHours: z
    .string()
    .default("168")
    .transform((value) => (value.trim() === "" ? 168 : Number(value)))
    .refine(
      (value) => Number.isInteger(value) && value >= 1 && value <= 8760,
      "Between 1 and 8760 hours",
    ),

  active: z.boolean().default(true),
});

export type ContentSourceInput = z.infer<typeof contentSourceInputSchema>;
