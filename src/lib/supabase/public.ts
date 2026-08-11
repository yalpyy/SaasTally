import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/**
 * Cookie-free Supabase client for **public catalogue reads**.
 *
 * Why this exists
 * ---------------
 * `createServerSupabase()` reads the auth session from cookies. Touching
 * cookies opts a route out of static rendering, so every public page became
 * dynamic at runtime and Next.js logged:
 *
 *   Page changed from static to dynamic at runtime /categories/ai, reason: cookies
 *
 * Public pages have no per-visitor state — everyone sees the same catalogue.
 * Reading them through an anonymous client keeps them statically renderable
 * and cacheable, which is what an SEO-led content site needs.
 *
 * Security
 * --------
 * This client carries only the publishable key, so RLS applies exactly as it
 * does for any anonymous visitor: `active` tools and `published` articles,
 * reviews and comparisons. It can never see draft or hidden rows — which is
 * precisely the guarantee we want on the public site.
 *
 * Anything that must respect the signed-in staff session (the admin, and every
 * mutation) keeps using `createServerSupabase()`.
 */
let cached: SupabaseClient | null = null;

export function createPublicSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cached) return cached;

  cached = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      // Stateless: no session to persist, refresh or parse from a URL.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return cached;
}
