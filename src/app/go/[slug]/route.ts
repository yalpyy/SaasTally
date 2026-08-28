import { NextResponse, type NextRequest } from "next/server";
import { getActiveProgramLink, recordClick } from "@/lib/affiliate/programs";
import { ctaPositions, sourceTypes } from "@/lib/affiliate/links";
import { getToolBySlug } from "@/services/tools";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Affiliate redirect.
 *
 *   click  →  resolve active program  →  record anonymous click  →  302 to vendor
 *
 * Design notes:
 *  - Affiliate destinations never appear in page markup; only /go/[slug] does.
 *  - No IP address, user agent string or identifier is stored.
 *  - If no active program exists we still send the user somewhere useful: the
 *    vendor's own site. A broken CTA is worse than an unattributed click.
 *  - Marked noindex/nofollow via headers in next.config.ts.
 */
function deviceTypeFrom(userAgent: string): "mobile" | "tablet" | "desktop" | "unknown" {
  if (!userAgent) return "unknown";
  if (/iPad|Tablet/i.test(userAgent)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(userAgent)) return "mobile";
  return "desktop";
}

/**
 * Attribution parameters are attacker-controlled: anyone can hand-craft a /go
 * URL, and whatever it carries lands in `affiliate_clicks`. Unfiltered, that
 * turns click reporting into a free-text field a stranger can fill.
 *
 * `t` and `p` are ours, so they are matched against the values our own link
 * builder emits and dropped otherwise. `s` is a path, so it has to start with
 * a slash and stay short — a wrong-but-plausible page is noise we can live
 * with; an arbitrary payload is not.
 */
const SOURCE_TYPES: ReadonlySet<string> = new Set(sourceTypes);
const CTA_POSITIONS: ReadonlySet<string> = new Set(ctaPositions);

function known(value: string | null, allowed: ReadonlySet<string>): string | null {
  return value && allowed.has(value) ? value : null;
}

function sourcePath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.length > 120) return null;
  return value;
}

/**
 * A row could predate the admin's URL validation, or have been written
 * straight into Postgres. Refusing to bounce a visitor through anything but
 * http(s) keeps our own redirect from carrying someone else's scheme.
 */
function isHttpUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    return NextResponse.redirect(absoluteUrl("/software"), 302);
  }

  const program = await getActiveProgramLink(slug);

  // Prefer the affiliate link, fall back to the vendor's own site, and if
  // neither is a usable http(s) URL send the visitor somewhere real rather
  // than into a broken redirect.
  const destination = [program?.affiliateUrl, tool.websiteUrl].find(isHttpUrl);
  if (!destination) {
    return NextResponse.redirect(absoluteUrl("/software"), 302);
  }

  // Only attribute the click if it is actually going through the affiliate
  // link. A program whose URL failed the check above sends the visitor to the
  // vendor instead, and recording that as an affiliate click would overstate
  // what the partner owes us.
  if (program && destination === program.affiliateUrl) {
    const { searchParams } = request.nextUrl;

    await recordClick({
      affiliateProgramId: program.id,
      sourcePage: sourcePath(searchParams.get("s")),
      sourceType: known(searchParams.get("t"), SOURCE_TYPES),
      ctaPosition: known(searchParams.get("p"), CTA_POSITIONS),
      // Derived and immediately discarded — the raw string is never stored.
      deviceType: deviceTypeFrom(request.headers.get("user-agent") ?? ""),
      country: request.headers.get("x-vercel-ip-country"),
    });
  }

  const response = NextResponse.redirect(destination, 302);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}
