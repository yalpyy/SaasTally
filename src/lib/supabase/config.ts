/**
 * Supabase configuration guard.
 *
 * The whole app is designed to run in two modes:
 *
 *  - **mock mode**  — no credentials present. Services read from
 *    `src/data/*` fixtures. Writes are disabled and the admin UI says so.
 *  - **live mode**  — credentials present. Services read from Postgres.
 *
 * Nothing should ever *pretend* a write succeeded in mock mode.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_PUBLISHABLE_KEY.length > 0;
}

/** Server-only. Never import this from a Client Component. */
export function getServiceRoleKey(): string | null {
  const key = process.env.SUPABASE_SECRET_KEY;
  return key && key.length > 0 ? key : null;
}

export const dataMode = (): "live" | "mock" => (isSupabaseConfigured() ? "live" : "mock");
