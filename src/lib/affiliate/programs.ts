import "server-only";

import { affiliatePrograms as fixturePrograms } from "@/data/affiliate-programs";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import type { AffiliateProgram } from "@/types";

/** Resolve the single active affiliate program for a tool, if one exists. */
export async function getActiveProgram(toolSlug: string): Promise<AffiliateProgram | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("affiliate_programs")
        .select("id, network, program_name, affiliate_url, commission_type, commission_value, cookie_days, status, tools!inner(slug)")
        .eq("status", "active")
        .eq("tools.slug", toolSlug)
        .limit(1)
        .maybeSingle();

      if (data) {
        const row = data as unknown as {
          id: string;
          network: string | null;
          program_name: string | null;
          affiliate_url: string;
          commission_type: string | null;
          commission_value: string | null;
          cookie_days: number | null;
          status: string;
        };

        return {
          id: row.id,
          toolSlug,
          network: row.network ?? "",
          programName: row.program_name ?? "",
          affiliateUrl: row.affiliate_url,
          commissionType: (row.commission_type as AffiliateProgram["commissionType"]) ?? "flat",
          commissionValue: row.commission_value ?? "",
          cookieDays: row.cookie_days ?? 0,
          status: "active",
        };
      }
      return null;
    }
  }

  return (
    fixturePrograms.find(
      (program) => program.toolSlug === toolSlug && program.status === "active",
    ) ?? null
  );
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
