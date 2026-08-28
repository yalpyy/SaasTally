import { z } from "zod";
import { optionalText, requiredText, slugField } from "./common";

/**
 * Author input.
 *
 * Deliberately small. An author page exists to let a reader judge who is
 * recommending software to them, so the fields are the ones that answer that:
 * who they are, what they do, where else they can be found.
 */
export const authorInputSchema = z.object({
  name: requiredText(2, 80, "Name"),
  slug: slugField,
  title: optionalText(120),
  bio: optionalText(2000),
  avatarUrl: optionalText(500),
  linkX: optionalText(200),
  linkLinkedin: optionalText(200),
  linkWebsite: optionalText(200),
});

export type AuthorInput = z.infer<typeof authorInputSchema>;
