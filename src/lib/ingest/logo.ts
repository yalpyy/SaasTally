import "server-only";

import { fetchImage } from "./fetcher";
import { findLogoCandidates } from "./metadata";
import type { QueueClient } from "./queue";
import { BUCKETS, extensionForMime, uploadImage } from "@/lib/storage";

/**
 * Collecting a vendor's logo.
 *
 * The catalogue read `logo_url` on every card from the first commit and
 * nothing ever wrote it, so every tool rendered a monogram. This fills it from
 * the one source that is unambiguously correct: the mark the vendor publishes
 * on their own site, in their own markup.
 *
 * Three decisions worth stating.
 *
 * **We store a copy rather than hot-linking.** Pointing `<Image>` at fifty
 * vendor domains would mean fifty allowed image hosts in `next.config`, a
 * broken tile every time one of them reorganises their assets, and a request
 * from every reader's browser to every vendor on the page. One copy in our own
 * bucket costs a few kilobytes and removes all three.
 *
 * **We never overwrite.** A logo already on the row was either collected once
 * already or uploaded by an editor who was not happy with what we collected.
 * Re-running the pipeline must not undo that.
 *
 * **This is not editorial.** A logo is the vendor's own asset used to identify
 * their product in a comparison — the same nominative use as printing their
 * name. It carries no judgement, which is why it is safe to automate when a
 * score never would be.
 */

/** How many candidates to try before giving up. Each one is an HTTP request. */
const MAX_ATTEMPTS = 4;

export interface LogoResult {
  stored: boolean;
  url?: string;
  detail: string;
}

/**
 * A last resort for sites whose only icon is an `.ico`.
 *
 * ICO cannot be decoded by the image optimiser and SVG is not served without
 * opting into untrusted markup, so a site that publishes only those two would
 * otherwise get nothing. Google's favicon endpoint re-encodes to PNG, which we
 * then download and store like any other candidate — readers never touch it,
 * and the only thing sent is a domain name that is already public.
 *
 * Remove this and the feature still works; coverage just drops.
 */
function fallbackCandidate(pageUrl: string): string | null {
  try {
    const host = new URL(pageUrl).hostname;
    return `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(host)}`;
  } catch {
    return null;
  }
}

export async function collectToolLogo(
  supabase: QueueClient,
  tool: { id: string; slug: string; logo_url: string | null },
  html: string,
  pageUrl: string,
): Promise<LogoResult> {
  if (tool.logo_url) return { stored: false, detail: "logo already set" };

  const candidates = findLogoCandidates(html, pageUrl).slice(0, MAX_ATTEMPTS);
  const fallback = fallbackCandidate(pageUrl);
  if (fallback) candidates.push(fallback);

  if (candidates.length === 0) return { stored: false, detail: "no logo candidates" };

  const reasons: string[] = [];

  for (const candidate of candidates) {
    const image = await fetchImage(candidate);

    if (image.kind === "error") {
      reasons.push(image.reason);
      continue;
    }

    const extension = extensionForMime(image.contentType);
    if (!extension) {
      // Usually SVG or ICO. Not a failure — just not something we can render.
      reasons.push(`unsupported ${image.contentType}`);
      continue;
    }

    const upload = await uploadImage({
      bucket: BUCKETS.toolLogos,
      // Keyed by slug, not by a random id: one logo per tool, and re-running
      // after a failure replaces the file instead of littering the bucket.
      path: `${tool.slug}.${extension}`,
      body: image.bytes,
      contentType: image.contentType,
      as: "service",
      upsert: true,
    });

    if (!upload.ok || !upload.url) {
      // A storage failure is worth surfacing rather than silently retrying the
      // next candidate — if the bucket is missing, none of them will work.
      return { stored: false, detail: `logo upload failed: ${upload.error ?? "unknown"}` };
    }

    const { error } = await supabase
      .from("tools")
      .update({ logo_url: upload.url, logo_source_url: candidate })
      .eq("id", tool.id);

    if (error) return { stored: false, detail: `logo not saved: ${error.message}` };

    return { stored: true, url: upload.url, detail: "logo collected" };
  }

  return { stored: false, detail: `no usable logo (${reasons.slice(0, 3).join("; ")})` };
}
