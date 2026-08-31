import { suggestSlug } from "./common";

/**
 * Bulk tool import.
 *
 * The bottleneck when starting a catalogue is not writing the descriptions —
 * it is getting a hundred rows to exist at all so the rest of the pipeline has
 * something to work on. So this takes the four things only a person can supply
 * (what it is called, where it lives, what it competes with, where its pricing
 * is) and leaves every other field empty for the ingest pipeline or an editor
 * to fill.
 *
 * One tool per line, pipe-separated, which is what a spreadsheet column paste
 * looks like:
 *
 *   Name | https://vendor.com | category,category | https://vendor.com/pricing
 *
 * The fourth field is optional. When present it also becomes a watched source,
 * so importing a tool schedules the fetch that fills in its facts.
 */

export interface ParsedImportLine {
  lineNumber: number;
  name: string;
  slug: string;
  websiteUrl: string;
  categorySlugs: string[];
  pricingUrl: string | null;
}

export interface ImportLineError {
  lineNumber: number;
  raw: string;
  message: string;
}

export interface ParsedImport {
  rows: ParsedImportLine[];
  errors: ImportLineError[];
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Parse the pasted block.
 *
 * Every line is checked and every problem is reported, rather than stopping at
 * the first one: someone pasting fifty rows wants the whole list of what is
 * wrong, not fifty round trips.
 */
export function parseToolImport(text: string, knownCategorySlugs: string[]): ParsedImport {
  const known = new Set(knownCategorySlugs);
  const rows: ParsedImportLine[] = [];
  const errors: ImportLineError[] = [];
  const seenSlugs = new Set<string>();

  const lines = text.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const line = raw.trim();
    const lineNumber = index + 1;

    // Blank lines and comments let someone keep notes in the paste.
    if (!line || line.startsWith("#")) continue;

    const parts = line.split("|").map((part) => part.trim());

    if (parts.length < 3) {
      errors.push({
        lineNumber,
        raw: line,
        message: "Needs at least: Name | website URL | category",
      });
      continue;
    }

    const [name, websiteUrl, categoryField, pricingUrl] = parts;

    if (name.length < 2) {
      errors.push({ lineNumber, raw: line, message: "Name is too short" });
      continue;
    }

    if (!isHttpUrl(websiteUrl)) {
      errors.push({
        lineNumber,
        raw: line,
        message: `"${websiteUrl}" is not a full http(s) URL`,
      });
      continue;
    }

    const categorySlugs = categoryField
      .split(",")
      .map((slug) => slug.trim().toLowerCase())
      .filter(Boolean);

    if (categorySlugs.length === 0) {
      errors.push({ lineNumber, raw: line, message: "At least one category is required" });
      continue;
    }

    const unknown = categorySlugs.filter((slug) => !known.has(slug));
    if (unknown.length > 0) {
      errors.push({
        lineNumber,
        raw: line,
        message: `Unknown category: ${unknown.join(", ")}`,
      });
      continue;
    }

    if (pricingUrl && !isHttpUrl(pricingUrl)) {
      errors.push({
        lineNumber,
        raw: line,
        message: `"${pricingUrl}" is not a full http(s) URL`,
      });
      continue;
    }

    const slug = suggestSlug(name);
    if (!slug) {
      errors.push({ lineNumber, raw: line, message: "Name produces an empty slug" });
      continue;
    }

    // Catch collisions inside the paste itself. The database would reject the
    // second one anyway, but only after inserting the first — better to say so
    // before writing anything.
    if (seenSlugs.has(slug)) {
      errors.push({
        lineNumber,
        raw: line,
        message: `"${slug}" appears more than once in this list`,
      });
      continue;
    }
    seenSlugs.add(slug);

    rows.push({
      lineNumber,
      name,
      slug,
      websiteUrl,
      categorySlugs,
      pricingUrl: pricingUrl || null,
    });
  }

  return { rows, errors };
}
