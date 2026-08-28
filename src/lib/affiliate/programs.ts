import "server-only";

import { affiliatePrograms as fixturePrograms } from "@/data/affiliate-programs";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createReadSupabase, createServiceSupabase } from "@/lib/supabase/server";

/**
 * The only affiliate data a public request may resolve: which program to
 * attribute the click to, and where to send the visitor.
 *
 * Commission terms are deliberately absent. They are admin-only in the
 * database (migration 0002), and nothing on the public path has any business
 * reading them — the editorial firewall is easier to keep when the commercial
 * columns cannot travel this far in the first place.
 */
export interface AffiliateLink {
  id: string;
  affiliateUrl: string;
}

/**
 * Resolve the redirect target for a tool, if it has an active program.
 *
 * Goes through the `active_affiliate_link` function rather than selecting from
 * `affiliate_programs` directly: anonymous clients can no longer read that
 * table, and the function returns only the program id and the destination.
 */
export async function getActiveProgramLink(toolSlug: string): Promise<AffiliateLink | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createReadSupabase();
    if (supabase) {
      const { data } = await supabase.rpc("active_affiliate_link", { tool_slug: toolSlug });
      const row = (data as { id: string; affiliate_url: string }[] | null)?.[0];

      return row ? { id: row.id, affiliateUrl: row.affiliate_url } : null;
    }
  }

  const fixture = fixturePrograms.find(
    (program) => program.toolSlug === toolSlug && program.status === "active",
  );

  return fixture ? { id: fixture.id, affiliateUrl: fixture.affiliateUrl } : null;
}

export interface ClickContext {
  affiliateProgramId: string;
  sourcePage: string | null;
  sourceType: string | null;
  ctaPosition: string | null;
  deviceType: "mobile" | "tablet" | "desktop" | "unknown";
  country: string | null;
}

/**
 * Records an aggregate-friendly click row.
 *
 * Deliberately stores no IP address, no user agent string and no identifiers.
 * Failures are swallowed — analytics must never break an outbound redirect.
 */
export async function recordClick(context: ClickContext): Promise<void> {
  const supabase = createServiceSupabase();
  if (!supabase) return;

  try {
    await supabase.from("affiliate_clicks").insert({
      affiliate_program_id: context.affiliateProgramId,
      source_page: context.sourcePage,
      source_type: context.sourceType,
      cta_position: context.ctaPosition,
      device_type: context.deviceType,
      country: context.country,
    });
  } catch {
    // Intentionally ignored.
  }
}
