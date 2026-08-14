import "server-only";

import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  getServiceRoleKey,
  isSupabaseConfigured,
} from "./config";

/**
 * Shape of the cookies `@supabase/ssr` asks us to write back. Annotated
 * explicitly because the `cookies` option is a union of method sets, which
 * blocks TypeScript from contextually typing the callback parameter.
 */
type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Session-scoped client. Reads the auth cookie, so RLS applies to the
 * signed-in staff member. Only `src/lib/auth.ts` needs this — touching cookies
 * opts a route out of static rendering, so never use it for public pages.
 */
export async function createServerSupabase() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render — safe to ignore, the
          // middleware refreshes the session instead.
        }
      },
    },
  });
}

/**
 * Cookie-free anonymous client. Works during the build and at request time,
 * and carries no session, so RLS treats it as an anonymous visitor: only
 * `active` tools and `published` content are visible.
 */
export function createPublicSupabase() {
  if (!isSupabaseConfigured()) return null;

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        /* anonymous client is stateless */
      },
    },
  });
}

/**
 * Cookie-free anon client for build-time and public reads.
 * RLS already limits anonymous reads to active/published rows, so this is
 * safe for every public page — it simply has no session attached.
 */
export function createAnonSupabase() {
  if (!isSupabaseConfigured()) return null;
  return createSupabaseClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Read client used by the service layer. Prefers the cookie-scoped client so
 * signed-in staff see drafts, but falls back to anon when there is no request
 * context (static generation, sitemap).
 */
export async function createReadSupabase() {
  if (!isSupabaseConfigured()) return null;
  try {
    return await createServerSupabase();
  } catch {
    return createAnonSupabase();
  }
}

/**
 * Client for public catalogue reads.
 *
 * Always anonymous — deliberately. The public catalogue is identical for every
 * visitor, so reading it through the session client bought nothing and cost
 * static rendering: any access to `cookies()` forces the page dynamic and
 * Next.js logs "Page changed from static to dynamic at runtime".
 *
 * Stays `async` so existing `await createReadSupabase()` call sites are unchanged.
 */
export async function createReadSupabase() {
  return createPublicSupabase();
}

/**
 * Service-role client. SERVER ONLY, and only for operations that must bypass
 * RLS — currently just recording anonymous affiliate clicks.
 */
export function createServiceSupabase() {
  const secret = getServiceRoleKey();
  if (!isSupabaseConfigured() || !secret) return null;

  return createServerClient(SUPABASE_URL, secret, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        /* service client is stateless */
      },
    },
  });
}
