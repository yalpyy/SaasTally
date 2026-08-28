/**
 * Client-safe affiliate helpers.
 *
 * Affiliate destinations are never rendered into the page. Every outbound CTA
 * points at our own `/go/[slug]` endpoint, which resolves the active program on
 * the server, records an anonymous click and redirects.
 */
/**
 * Exported as values, not just types, because /go validates the incoming
 * parameters against exactly this set. Anyone can hand-craft a /go URL, so the
 * two lists have to be the same list — not two copies that drift apart.
 */
export const ctaPositions = [
  "hero",
  "card",
  "tool-header",
  "tool-pricing",
  "comparison",
  "best-list",
  "review",
  "sidebar",
] as const;

export const sourceTypes = [
  "tool",
  "category",
  "article",
  "comparison",
  "best",
  "review",
  "home",
] as const;

export type CtaPosition = (typeof ctaPositions)[number];
export type SourceType = (typeof sourceTypes)[number];

export interface AffiliateLinkOptions {
  /** Where the click happened, e.g. `/tools/semrush`. */
  source?: string;
  /** What kind of surface produced the click. */
  sourceType?: SourceType;
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

/**
 * Attributes every outbound affiliate link must carry.
 *
 * `sponsored` is the value Google asks for on paid links and would be enough
 * on its own there; `nofollow` is kept alongside it because every other
 * crawler and link-auditing tool still reads that one, and being explicit
 * about a paid link costs nothing.
 */
export const affiliateLinkAttributes = {
  rel: "sponsored nofollow noopener noreferrer",
  target: "_blank",
} as const;
