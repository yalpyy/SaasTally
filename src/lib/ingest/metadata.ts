import "server-only";

import type { ExtractedFacts } from "./extract";

/**
 * Free fact extraction, straight out of the page's own markup.
 *
 * Vendors already publish a one-line summary of their product for search
 * engines and link previews — `meta description`, the Open Graph tags, and
 * increasingly a JSON-LD block. Reading those costs nothing and, unlike a
 * model's paraphrase, the words are the vendor's own claim about their own
 * product. For a catalogue entry that is not a lesser source; it is arguably
 * a better one.
 *
 * What it cannot do is read a pricing table. Prices live in styled markup that
 * varies per site, and guessing at the largest currency figure on a page is
 * how a catalogue ends up quoting an enterprise tier as a starting price. So
 * this returns a price only when the page states one in structured data, where
 * it is labelled rather than inferred.
 */

/** Decode the handful of entities that survive into meta tag content. */
function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pull one meta tag's content.
 *
 * Attribute order varies (`name` before `content` or after), so this looks for
 * the tag first and reads its attributes second rather than trying to write
 * one regex that covers both.
 */
function metaContent(html: string, keys: string[]): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const nameMatch = tag.match(/\b(?:name|property)\s*=\s*["']([^"']+)["']/i);
    if (!nameMatch) continue;
    if (!keys.includes(nameMatch[1].toLowerCase())) continue;

    const contentMatch = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
    if (!contentMatch) continue;

    const value = decodeEntities(contentMatch[1]);
    if (value) return value;
  }

  return null;
}

interface JsonLdNode {
  "@type"?: unknown;
  name?: unknown;
  description?: unknown;
  foundingDate?: unknown;
  offers?: unknown;
  [key: string]: unknown;
}

/** Flatten @graph and arrays so a node is found wherever the site put it. */
function collectJsonLdNodes(html: string): JsonLdNode[] {
  const blocks =
    html.match(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ??
    [];

  const nodes: JsonLdNode[] = [];

  for (const block of blocks) {
    const body = block.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");

    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      // Malformed JSON-LD is common and not worth failing a fetch over.
      continue;
    }

    const queue: unknown[] = [parsed];
    while (queue.length > 0) {
      const item = queue.shift();
      if (Array.isArray(item)) {
        queue.push(...item);
        continue;
      }
      if (item && typeof item === "object") {
        const node = item as JsonLdNode;
        nodes.push(node);
        if (Array.isArray(node["@graph"])) queue.push(...(node["@graph"] as unknown[]));
      }
    }
  }

  return nodes;
}

function typeOf(node: JsonLdNode): string[] {
  const raw = node["@type"];
  if (typeof raw === "string") return [raw.toLowerCase()];
  if (Array.isArray(raw)) return raw.filter((t): t is string => typeof t === "string").map((t) => t.toLowerCase());
  return [];
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? decodeEntities(value) : null;
}

/**
 * A price from JSON-LD `offers`, kept in the page's own wording.
 *
 * Only taken when the node labels it as a price. A number found loose in the
 * markup could be anything — a discount, a saving, a seat count.
 */
function offerPrice(node: JsonLdNode): { price: string | null; currency: string | null } {
  const offers = node.offers;
  const list = Array.isArray(offers) ? offers : offers ? [offers] : [];

  for (const offer of list) {
    if (!offer || typeof offer !== "object") continue;
    const record = offer as Record<string, unknown>;

    const price = record.price ?? record.lowPrice;
    const currency = asString(record.priceCurrency);

    if (typeof price === "number") return { price: String(price), currency };
    const priceString = asString(price);
    if (priceString) return { price: priceString, currency };
  }

  return { price: null, currency: null };
}

/**
 * Read what the page declares about itself.
 *
 * Returns null when there is not even a description — a page that says nothing
 * about the product is not worth a catalogue row, and an empty result is
 * clearer than a row full of nulls.
 */
export function factsFromMarkup(html: string): ExtractedFacts | null {
  const nodes = collectJsonLdNodes(html);

  const productNode = nodes.find((node) => {
    const types = typeOf(node);
    return (
      types.includes("softwareapplication") ||
      types.includes("product") ||
      types.includes("webapplication")
    );
  });

  const orgNode = nodes.find((node) => {
    const types = typeOf(node);
    return types.includes("organization") || types.includes("corporation");
  });

  const ogDescription = metaContent(html, ["og:description", "twitter:description"]);
  const metaDescription = metaContent(html, ["description"]);

  const jsonLdDescription = productNode ? asString(productNode.description) : null;
  const description = jsonLdDescription ?? ogDescription ?? metaDescription;

  if (!description) return null;

  // The shorter of the two reads better on a card; the longer one carries more
  // on the page itself.
  const short = metaDescription && metaDescription.length <= 160 ? metaDescription : description;

  const { price, currency } = productNode
    ? offerPrice(productNode)
    : { price: null, currency: null };

  const foundingDate = orgNode ? asString(orgNode.foundingDate) : null;
  const foundedYear = foundingDate ? Number(foundingDate.slice(0, 4)) : null;

  return {
    shortDescription: short.slice(0, 160),
    description,
    companyName: orgNode ? asString(orgNode.name) : null,
    foundedYear: foundedYear && foundedYear > 1900 && foundedYear < 2100 ? foundedYear : null,
    startingPrice: price,
    currency,
    pricingModel: null,
    tiers: [],
    features: [],
    missing: "Collected from page metadata only — no model was used.",
  };
}

/**
 * Find the vendor's pricing page from their own navigation.
 *
 * Saves asking anyone to paste a second URL: almost every SaaS site links its
 * pricing from the header. Same-host links only, because an off-site "pricing"
 * link is a partner or a reseller, not this product's own page.
 */
export function findPricingLink(html: string, baseUrl: string): string | null {
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return null;
  }

  const anchors = html.match(/<a\b[^>]*href\s*=\s*["'][^"']+["'][^>]*>[\s\S]*?<\/a>/gi) ?? [];

  for (const anchor of anchors) {
    const hrefMatch = anchor.match(/href\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch) continue;

    const label = anchor.replace(/<[^>]+>/g, " ").toLowerCase();
    const href = hrefMatch[1];

    const looksLikePricing =
      /\/(pricing|plans|price)(\/|$|\?|#)/i.test(href) ||
      /\b(pricing|plans & pricing|see pricing)\b/.test(label);

    if (!looksLikePricing) continue;

    try {
      const resolved = new URL(href, base);
      if (resolved.host !== base.host) continue;
      if (resolved.protocol !== "https:" && resolved.protocol !== "http:") continue;

      resolved.hash = "";
      return resolved.toString();
    } catch {
      continue;
    }
  }

  return null;
}
