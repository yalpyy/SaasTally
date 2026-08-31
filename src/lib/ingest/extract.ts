import "server-only";

import Anthropic from "@anthropic-ai/sdk";

/**
 * Fact extraction from a fetched vendor page.
 *
 * The job here is narrow on purpose: turn marketing prose into typed fields we
 * can attribute to a URL and a date. It does not write copy, score anything or
 * decide what is good — those are the parts of this site that have to be
 * someone's judgement, and a page that reads well but was never anyone's
 * opinion is the failure mode this whole design exists to avoid.
 *
 * Everything is optional in the output. A field the page does not state comes
 * back null, because "unknown" and "free" are different answers and only one
 * of them is safe to publish.
 */

export const PROMPT_VERSION = "tool-facts-1";

/**
 * Extraction is a mechanical read of a page into typed fields, which is what
 * the cheapest model is good at — roughly 2.5 cents a tool rather than 13.
 * Override with INGEST_MODEL if the quality does not hold on awkward pricing
 * tables (per-seat tiers, annual discounts, regional currencies).
 */
export const MODEL = process.env.INGEST_MODEL ?? "claude-haiku-4-5";

/**
 * `output_config.effort` is rejected outright by Haiku 4.5 and Sonnet 4.5, so
 * it is only sent for models that accept it. Getting this wrong is a 400 on
 * every extraction, at night, with nobody watching.
 */
const EFFORT_MODELS = new Set([
  "claude-opus-5",
  "claude-opus-4-8",
  "claude-opus-4-7",
  "claude-opus-4-6",
  "claude-sonnet-5",
  "claude-sonnet-4-6",
  "claude-fable-5",
]);

/** Enough of a pricing page to matter; the rest is footer and nav. */
const MAX_INPUT_CHARS = 60_000;

export interface ExtractedTier {
  name: string;
  price: string;
  billing: string | null;
}

export interface ExtractedFacts {
  shortDescription: string | null;
  description: string | null;
  companyName: string | null;
  foundedYear: number | null;
  startingPrice: string | null;
  currency: string | null;
  pricingModel: string | null;
  tiers: ExtractedTier[];
  features: string[];
  /** What the page did not say, in the model's own words. Kept for the log. */
  missing: string | null;
}

export interface ExtractionResult {
  ok: boolean;
  facts?: ExtractedFacts;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}

const SYSTEM = `You extract product facts from a software vendor's own web page for a software comparison catalogue.

Rules, in order of importance:

1. Report only what the page states. If the page does not say something, return null for it. Never infer, estimate, or fill a gap from your own knowledge of the product — the catalogue attributes these values to this page and this date, so a value the page does not contain is a false attribution.
2. Prices are quoted exactly as the page writes them, including currency and period: "$139/mo", "£29 per user/month", "Free". Do not convert currencies or normalise periods.
3. Never write evaluative language. No "powerful", "best-in-class", "intuitive", "leading". You are recording what the product is and costs, not how good it is.
4. shortDescription is one plain sentence, under 160 characters, saying what the product does. description is 2-4 sentences of the same kind.
5. features are concrete capabilities the page names, not benefits. "Keyword rank tracking" yes; "grow your traffic" no.
6. If the page is not a product page at all — an error page, a login wall, a blog post — return nulls throughout and say so in "missing".`;

const TOOL_SCHEMA = {
  type: "object" as const,
  properties: {
    shortDescription: { type: ["string", "null"] as const, maxLength: 160 },
    description: { type: ["string", "null"] as const },
    companyName: { type: ["string", "null"] as const },
    foundedYear: { type: ["integer", "null"] as const },
    startingPrice: {
      type: ["string", "null"] as const,
      description: "Cheapest paid plan as written, or 'Free' if a free tier is offered",
    },
    currency: { type: ["string", "null"] as const, description: "ISO code if determinable" },
    pricingModel: {
      type: ["string", "null"] as const,
      enum: ["free", "freemium", "subscription", "one-time", "usage-based", "custom", null],
    },
    tiers: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          name: { type: "string" as const },
          price: { type: "string" as const },
          billing: { type: ["string", "null"] as const },
        },
        required: ["name", "price", "billing"],
        additionalProperties: false,
      },
    },
    features: { type: "array" as const, items: { type: "string" as const } },
    missing: { type: ["string", "null"] as const },
  },
  required: [
    "shortDescription",
    "description",
    "companyName",
    "foundedYear",
    "startingPrice",
    "currency",
    "pricingModel",
    "tiers",
    "features",
    "missing",
  ],
  additionalProperties: false,
};

let client: Anthropic | null = null;

function anthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic();
  return client;
}

export function isExtractionConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Extract facts for one tool from one page.
 *
 * The system prompt is marked cacheable and comes first, but it is short
 * enough that it may fall under the model's minimum cacheable prefix and
 * simply not cache — which costs nothing and is why it is left in. The real
 * saving is upstream: an unchanged page never reaches this function at all.
 */
export async function extractToolFacts(
  toolName: string,
  pageText: string,
  sourceUrl: string,
): Promise<ExtractionResult> {
  const anthropicClient = anthropic();
  if (!anthropicClient) {
    return { ok: false, error: "ANTHROPIC_API_KEY is not set" };
  }

  const text = pageText.slice(0, MAX_INPUT_CHARS);

  try {
    const response = await anthropicClient.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: [
        {
          type: "text",
          text: SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      output_config: EFFORT_MODELS.has(MODEL)
        ? { effort: "low" as const, format: { type: "json_schema" as const, schema: TOOL_SCHEMA } }
        : { format: { type: "json_schema" as const, schema: TOOL_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `Product: ${toolName}\nSource page: ${sourceUrl}\n\nPage text:\n\n${text}`,
        },
      ],
    });

    const block = response.content.find((item) => item.type === "text");
    if (!block || block.type !== "text") {
      return { ok: false, error: "Model returned no text block" };
    }

    // Always parse rather than string-matching: escaping in the JSON varies.
    const facts = JSON.parse(block.text) as ExtractedFacts;

    return {
      ok: true,
      facts,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "Rate limited" };
    }
    if (error instanceof Anthropic.APIError) {
      return { ok: false, error: `Anthropic API ${error.status}: ${error.message}` };
    }
    const message = error instanceof Error ? error.message : "Extraction failed";
    return { ok: false, error: message };
  }
}

/**
 * Is there enough here to show a reader?
 *
 * The bar for publishing a page nobody has reviewed: it has to say what the
 * product does and what it costs. A page with a name and a link is not a
 * catalogue entry, it is a stub with our name on it.
 */
export function meetsPublishBar(facts: ExtractedFacts): boolean {
  const hasDescription = Boolean(facts.shortDescription && facts.shortDescription.length >= 20);
  const hasPricing = Boolean(facts.startingPrice) || facts.tiers.length > 0;
  return hasDescription && hasPricing;
}
