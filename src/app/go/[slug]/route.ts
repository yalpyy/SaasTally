import { NextResponse, type NextRequest } from "next/server";
import { getActiveProgram, recordClick } from "@/lib/affiliate/programs";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    return NextResponse.redirect(absoluteUrl("/software"), 302);
  }

  const program = await getActiveProgram(slug);
  const destination = program?.affiliateUrl ?? tool.websiteUrl;

  if (program) {
    const { searchParams } = request.nextUrl;

    await recordClick({
      affiliateProgramId: program.id,
      sourcePage: searchParams.get("s"),
      sourceType: searchParams.get("t"),
      ctaPosition: searchParams.get("p"),
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
