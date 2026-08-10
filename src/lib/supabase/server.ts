import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  getServiceRoleKey,
  isSupabaseConfigured,
} from "./config";

/**
 * Request-scoped Supabase client for Server Components, Route Handlers and
 * Server Actions. Reads the auth session from cookies so RLS applies to the
 * signed-in staff member.
 *
 * Returns `null` in mock mode so callers can fall back to fixtures instead of
 * throwing during local development.
 */
export async function createServerSupabase() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render — safe to ignore, the
          // middleware/route handler refreshes the session instead.
        }
      },
    },
  });
}

/**
 * Service-role client. SERVER ONLY, and only for operations that must bypass
 * RLS — currently just recording anonymous affiliate clicks.
 *
 * Never expose this client, its key, or any data it returns without filtering.
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
