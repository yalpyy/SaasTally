import "server-only";

import {
  extractToolFacts,
  isExtractionConfigured,
  meetsPublishBar,
  PROMPT_VERSION,
  type ExtractedFacts,
} from "./extract";
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
 */

export interface ApplyResult {
  applied: boolean;
  published: boolean;
  detail: string;
}

interface ToolRow {
  id: string;
  name: string;
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

export async function extractAndApply(
  supabase: QueueClient,
  source: { id: string; url: string; tool_id: string | null },
  pageText: string,
): Promise<ApplyResult> {
  if (!source.tool_id) {
    return { applied: false, published: false, detail: "source has no tool" };
  }

  if (!isExtractionConfigured()) {
    // Not an error: phase 1 ran without a key and recording the change is
    // still useful. Saying so beats a silent no-op.
    return { applied: false, published: false, detail: "no ANTHROPIC_API_KEY, skipped extraction" };
  }

  const { data, error } = await supabase
    .from("tools")
    .select("id, name, active, human_reviewed, short_description, description")
    .eq("id", source.tool_id)
    .maybeSingle();

  if (error || !data) {
    return { applied: false, published: false, detail: "tool not found" };
  }

  const tool = data as unknown as ToolRow;
  const result = await extractToolFacts(tool.name, pageText, source.url);

  if (!result.ok || !result.facts) {
    await supabase.from("extraction_runs").insert({
      source_id: source.id,
      tool_id: tool.id,
      model: "claude-opus-5",
      prompt_version: PROMPT_VERSION,
      ok: false,
      note: result.error ?? "unknown error",
    });

    return { applied: false, published: false, detail: `extraction failed: ${result.error}` };
  }

  const facts = result.facts;

  const { error: updateError } = await supabase
    .from("tools")
    .update(factsToToolUpdate(facts, tool, source.url))
    .eq("id", tool.id);

  if (updateError) {
    await supabase.from("extraction_runs").insert({
      source_id: source.id,
      tool_id: tool.id,
      model: "claude-opus-5",
      prompt_version: PROMPT_VERSION,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
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
    model: "claude-opus-5",
    prompt_version: PROMPT_VERSION,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    ok: true,
    applied: true,
    published,
    note: facts.missing,
  });

  const parts = ["facts applied"];
  if (published) parts.push("published");
  else if (!tool.active) parts.push("below publish bar, left as draft");

  return { applied: true, published, detail: parts.join(", ") };
}
