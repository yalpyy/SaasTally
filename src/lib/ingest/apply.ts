import "server-only";

import {
  extractToolFacts,
  isExtractionConfigured,
  meetsPublishBar,
  MODEL,
  PROMPT_VERSION,
  type ExtractedFacts,
} from "./extract";
import { factsFromMarkup } from "./metadata";
import { collectToolLogo } from "./logo";
import type { QueueClient } from "./queue";

/**
 * Turn a freshly fetched page into catalogue rows.
 *
 * Runs inside the fetch job, on the text still in memory. That is deliberate:
 * the vendor's page never reaches our database. We hash it, read facts out of
 * it, and drop it — what we keep is the URL, the date and the extracted
 * values, which is exactly what we would need to defend any figure on the site.
 *
 * Applying rather than proposing is a decision about what kind of value this
 * is. A price with a source and a timestamp is checkable, so it can go live;
 * anything that would read as a judgement is not produced here at all.
 *
 * There are two ways to get the facts. The page's own metadata — meta
 * description, Open Graph tags, JSON-LD — costs nothing and is the vendor's
 * own claim about their own product, so it is read first and always. A model
 * is only worth calling on top of that, for the pricing table that markup
 * cannot describe, and only when a key is configured. Running without one is
 * a supported mode, not a degraded one.
 */

export interface ApplyResult {
  applied: boolean;
  published: boolean;
  detail: string;
}

interface ToolRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  active: boolean;
  human_reviewed: boolean;
  short_description: string | null;
  description: string | null;
}

const PRICING_MODELS = new Set([
  "free",
  "freemium",
  "subscription",
  "one-time",
  "usage-based",
  "custom",
]);

/**
 * Which fields to write.
 *
 * Once a person has reviewed a tool, the machine stops touching its prose: an
 * editor's sentence should not be replaced overnight by a paraphrase of the
 * vendor's homepage. Prices keep updating either way — those are observations,
 * and a stale price is worse than a rewritten one.
 */
function factsToToolUpdate(
  facts: ExtractedFacts,
  tool: ToolRow,
  sourceUrl: string,
): Record<string, unknown> {
  const update: Record<string, unknown> = {
    facts_collected_at: new Date().toISOString(),
    facts_source_url: sourceUrl,
  };

  if (facts.startingPrice) update.starting_price = facts.startingPrice;
  if (facts.pricingModel && PRICING_MODELS.has(facts.pricingModel)) {
    update.pricing_model = facts.pricingModel;
  }

  if (tool.human_reviewed) return update;

  if (facts.shortDescription) update.short_description = facts.shortDescription;
  if (facts.description) update.description = facts.description;
  if (facts.companyName) update.company_name = facts.companyName;
  if (facts.foundedYear) update.founded_year = facts.foundedYear;
  if (facts.features.length > 0) update.features = facts.features;

  return update;
}

/** Prefer a stated value over a missing one, field by field. */
function mergeFacts(base: ExtractedFacts | null, extra: ExtractedFacts | null): ExtractedFacts | null {
  if (!base) return extra;
  if (!extra) return base;

  return {
    shortDescription: extra.shortDescription ?? base.shortDescription,
    description: extra.description ?? base.description,
    companyName: extra.companyName ?? base.companyName,
    foundedYear: extra.foundedYear ?? base.foundedYear,
    startingPrice: extra.startingPrice ?? base.startingPrice,
    currency: extra.currency ?? base.currency,
    pricingModel: extra.pricingModel ?? base.pricingModel,
    tiers: extra.tiers.length > 0 ? extra.tiers : base.tiers,
    features: extra.features.length > 0 ? extra.features : base.features,
    missing: extra.missing ?? base.missing,
  };
}

export async function extractAndApply(
  supabase: QueueClient,
  source: { id: string; url: string; tool_id: string | null },
  pageText: string,
  pageHtml: string,
): Promise<ApplyResult> {
  if (!source.tool_id) {
    return { applied: false, published: false, detail: "source has no tool" };
  }

  const { data, error } = await supabase
    .from("tools")
    .select("id, name, slug, logo_url, active, human_reviewed, short_description, description")
    .eq("id", source.tool_id)
    .maybeSingle();

  if (error || !data) {
    return { applied: false, published: false, detail: "tool not found" };
  }

  const tool = data as unknown as ToolRow;

  /**
   * The logo, before anything else.
   *
   * Independent of the facts: a page can fail to state a single thing we would
   * publish and still carry the vendor's own brand mark, and a catalogue of
   * monogram tiles looks unfinished in a way that missing prose does not.
   * `collectToolLogo` is a no-op once a logo exists, so re-runs cost nothing.
   */
  const logo = await collectToolLogo(supabase, tool, pageHtml, source.url);

  // Free first, and unconditionally: this is the vendor describing themselves.
  const markupFacts = factsFromMarkup(pageHtml);

  let modelFacts: ExtractedFacts | null = null;
  let usedModel = false;
  let inputTokens: number | undefined;
  let outputTokens: number | undefined;

  if (isExtractionConfigured()) {
    const result = await extractToolFacts(tool.name, pageText, source.url);
    usedModel = true;
    inputTokens = result.inputTokens;
    outputTokens = result.outputTokens;

    if (result.ok && result.facts) {
      modelFacts = result.facts;
    } else {
      await supabase.from("extraction_runs").insert({
        source_id: source.id,
        tool_id: tool.id,
        model: MODEL,
        prompt_version: PROMPT_VERSION,
        ok: false,
        note: result.error ?? "unknown error",
      });
    }
  }

  const facts = mergeFacts(markupFacts, modelFacts);

  if (!facts) {
    const why = usedModel ? "nothing extracted" : "no metadata on page, and no API key";
    return {
      applied: false,
      published: false,
      detail: logo.stored ? `${why}, but ${logo.detail}` : why,
    };
  }

  const { error: updateError } = await supabase
    .from("tools")
    .update(factsToToolUpdate(facts, tool, source.url))
    .eq("id", tool.id);

  if (updateError) {
    await supabase.from("extraction_runs").insert({
      source_id: source.id,
      tool_id: tool.id,
      model: usedModel ? MODEL : "markup-only",
      prompt_version: PROMPT_VERSION,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      ok: true,
      applied: false,
      note: `update failed: ${updateError.message}`,
    });

    return { applied: false, published: false, detail: "could not write facts" };
  }

  // Price history is append-only, and worth a row even when the headline
  // figure has not moved — "unchanged on this date" is itself a fact.
  if (facts.startingPrice || facts.tiers.length > 0) {
    await supabase.from("price_snapshots").insert({
      tool_id: tool.id,
      source_id: source.id,
      starting_price: facts.startingPrice,
      currency: facts.currency,
      tiers: facts.tiers,
    });
  }

  /**
   * Publishing.
   *
   * Only ever turns a page on, never off: an editor who hid a tool did it for
   * a reason the pipeline cannot see, and a nightly job overruling that would
   * be the worst kind of automation. A tool a person has already reviewed is
   * left alone entirely.
   */
  let published = false;
  if (!tool.active && !tool.human_reviewed && meetsPublishBar(facts)) {
    const { error: publishError } = await supabase
      .from("tools")
      .update({ active: true })
      .eq("id", tool.id);

    published = !publishError;
  }

  await supabase.from("extraction_runs").insert({
    source_id: source.id,
    tool_id: tool.id,
    model: usedModel ? MODEL : "markup-only",
    prompt_version: PROMPT_VERSION,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    ok: true,
    applied: true,
    published,
    note: facts.missing,
  });

  const parts = ["facts applied"];
  if (logo.stored) parts.push(logo.detail);
  if (published) parts.push("published");
  else if (!tool.active) parts.push("below publish bar, left as draft");

  return { applied: true, published, detail: parts.join(", ") };
}
