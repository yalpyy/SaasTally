/**
 * Client-safe affiliate helpers.
 *
 * Affiliate destinations are never rendered into the page. Every outbound CTA
 * points at our own `/go/[slug]` endpoint, which resolves the active program on
 * the server, records an anonymous click and redirects.
 */
export type CtaPosition =
  | "hero"
  | "card"
  | "tool-header"
  | "tool-pricing"
  | "comparison"
  | "best-list"
  | "review"
  | "sidebar";

export interface AffiliateLinkOptions {
  /** Where the click happened, e.g. `/tools/semrush`. */
  source?: string;
  /** What kind of surface produced the click. */
  sourceType?: "tool" | "category" | "article" | "comparison" | "best" | "review" | "home";
  position?: CtaPosition;
}

export function affiliateHref(toolSlug: string, options: AffiliateLinkOptions = {}): string {
  const params = new URLSearchParams();
  if (options.source) params.set("s", options.source);
  if (options.sourceType) params.set("t", options.sourceType);
  if (options.position) params.set("p", options.position);

  const query = params.toString();
  return `/go/${toolSlug}${query ? `?${query}` : ""}`;
}

/** Attributes every outbound affiliate link must carry. */
export const affiliateLinkAttributes = {
  rel: "sponsored noopener noreferrer",
  target: "_blank",
} as const;
