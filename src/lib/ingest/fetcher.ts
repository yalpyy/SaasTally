import "server-only";

import { createHash } from "node:crypto";

/**
 * Polite HTTP fetching for the ingest pipeline.
 *
 * We are reading other people's sites on a schedule, so the manners are part
 * of the feature rather than a nicety bolted on later: we say who we are, we
 * obey robots.txt, we do not hammer a host, and we send conditional headers so
 * an unchanged page costs the vendor a 304 instead of a full response.
 *
 * What we keep is deliberately narrow — a hash, a size, and a short excerpt for
 * debugging. The page body itself is the vendor's content; we hold it only long
 * enough to decide whether anything changed.
 */

export const USER_AGENT =
  "SaaSTallyBot/1.0 (+https://saastally.com/bot; compare-software crawler)";

/** Vendor marketing pages are small; anything larger is not a pricing page. */
const MAX_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 15_000;

/** Minimum gap between two requests to the same host, within one run. */
const HOST_DELAY_MS = 2_000;

const lastHitByHost = new Map<string, number>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Space out requests per host. Politeness, and it keeps us off block lists. */
async function waitForHost(host: string): Promise<void> {
  const last = lastHitByHost.get(host);
  const now = Date.now();

  if (last !== undefined) {
    const elapsed = now - last;
    if (elapsed < HOST_DELAY_MS) await sleep(HOST_DELAY_MS - elapsed);
  }

  lastHitByHost.set(host, Date.now());
}

async function withTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------------- */
/* robots.txt                                                                */
/* ------------------------------------------------------------------------- */

interface RobotsRules {
  disallow: string[];
  allow: string[];
}

const robotsCache = new Map<string, RobotsRules | null>();

/**
 * A deliberately small robots.txt reader: the `User-agent: *` group plus any
 * group naming us, and only Allow/Disallow within it.
 *
 * It does not implement crawl-delay (we impose our own, larger delay) or
 * wildcards beyond a trailing `*`. When robots.txt cannot be read we treat the
 * host as allowed — the same thing a browser does — but a 4xx on the page
 * itself still stops us.
 */
function parseRobots(text: string): RobotsRules {
  const rules: RobotsRules = { disallow: [], allow: [] };
  let applies = false;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === "user-agent") {
      const agent = value.toLowerCase();
      applies = agent === "*" || agent === "saastallybot";
      continue;
    }

    if (!applies) continue;
    if (field === "disallow" && value) rules.disallow.push(value);
    if (field === "allow" && value) rules.allow.push(value);
  }

  return rules;
}

function pathMatches(pattern: string, path: string): boolean {
  if (pattern.endsWith("*")) return path.startsWith(pattern.slice(0, -1));
  return path.startsWith(pattern);
}

async function loadRobots(origin: string): Promise<RobotsRules | null> {
  if (robotsCache.has(origin)) return robotsCache.get(origin) ?? null;

  let rules: RobotsRules | null = null;

  try {
    const response = await withTimeout(`${origin}/robots.txt`, {
      headers: { "user-agent": USER_AGENT },
    });

    // 2xx gives us rules; anything else means "no rules published", which is
    // not the same as "forbidden".
    if (response.ok) rules = parseRobots(await response.text());
  } catch {
    // Unreachable robots.txt is not a reason to refuse the whole host.
  }

  robotsCache.set(origin, rules);
  return rules;
}

export async function isAllowedByRobots(url: string): Promise<boolean> {
  const parsed = new URL(url);
  const rules = await loadRobots(parsed.origin);
  if (!rules) return true;

  const path = parsed.pathname + parsed.search;

  // Longest match wins, and Allow beats Disallow at equal length — the usual
  // precedence rule, and the one that keeps a broad Disallow from swallowing a
  // specific Allow.
  let verdict = true;
  let bestLength = -1;

  for (const pattern of rules.disallow) {
    if (pathMatches(pattern, path) && pattern.length > bestLength) {
      verdict = false;
      bestLength = pattern.length;
    }
  }

  for (const pattern of rules.allow) {
    if (pathMatches(pattern, path) && pattern.length >= bestLength) {
      verdict = true;
      bestLength = pattern.length;
    }
  }

  return verdict;
}

/* ------------------------------------------------------------------------- */
/* Text extraction and hashing                                               */
/* ------------------------------------------------------------------------- */

/**
 * Reduce HTML to visible text.
 *
 * Crude on purpose. The hash needs to be stable against the noise a marketing
 * page changes on every request — session ids, CSRF tokens, analytics blobs,
 * inlined build hashes — and all of that lives in script, style and attributes.
 * Dropping them wholesale is both simpler and more stable than parsing.
 */
export function extractText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/* ------------------------------------------------------------------------- */
/* Fetch                                                                     */
/* ------------------------------------------------------------------------- */

export type FetchOutcome =
  /** The page was fetched and its text differs from what we last saw. */
  | { kind: "changed"; status: number; text: string; hash: string; bytes: number; etag: string | null; lastModified: string | null }
  /** Fetched, but the text hashes to what we already have. */
  | { kind: "unchanged"; status: number; etag: string | null; lastModified: string | null }
  /** robots.txt says not to. */
  | { kind: "blocked"; reason: string }
  /** Anything else — network, timeout, 4xx, 5xx, oversized. */
  | { kind: "error"; status: number | null; reason: string };

export interface FetchOptions {
  etag?: string | null;
  lastModified?: string | null;
  previousHash?: string | null;
}

/**
 * Fetch one source URL and report what changed.
 *
 * Conditional headers come first: if the server answers 304 we never read a
 * body, which is the cheapest possible outcome for both sides. When we do read
 * one, the text hash is the real check — plenty of servers ignore conditional
 * requests and return 200 for a page that has not moved in a year.
 */
export async function fetchSource(url: string, options: FetchOptions = {}): Promise<FetchOutcome> {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return { kind: "error", status: null, reason: "Not a valid URL" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { kind: "error", status: null, reason: `Unsupported scheme ${parsed.protocol}` };
  }

  if (!(await isAllowedByRobots(url))) {
    return { kind: "blocked", reason: "Disallowed by robots.txt" };
  }

  await waitForHost(parsed.host);

  const headers: Record<string, string> = {
    "user-agent": USER_AGENT,
    accept: "text/html,application/xhtml+xml",
    "accept-language": "en",
  };
  if (options.etag) headers["if-none-match"] = options.etag;
  if (options.lastModified) headers["if-modified-since"] = options.lastModified;

  let response: Response;

  try {
    response = await withTimeout(url, { headers });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Fetch failed";
    return { kind: "error", status: null, reason };
  }

  const etag = response.headers.get("etag");
  const lastModified = response.headers.get("last-modified");

  if (response.status === 304) {
    return { kind: "unchanged", status: 304, etag, lastModified };
  }

  if (!response.ok) {
    return { kind: "error", status: response.status, reason: `HTTP ${response.status}` };
  }

  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BYTES) {
    return { kind: "error", status: response.status, reason: "Response too large" };
  }

  const html = await response.text();
  if (html.length > MAX_BYTES) {
    return { kind: "error", status: response.status, reason: "Response too large" };
  }

  const text = extractText(html);
  const hash = hashText(text);

  if (options.previousHash && options.previousHash === hash) {
    return { kind: "unchanged", status: response.status, etag, lastModified };
  }

  return {
    kind: "changed",
    status: response.status,
    text,
    hash,
    bytes: html.length,
    etag,
    lastModified,
  };
}
