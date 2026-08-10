import "server-only";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabase } from "@/lib/supabase/server";
import type { StaffRole } from "@/types";

export interface StaffProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  role: StaffRole;
}

/**
 * Reads the signed-in staff profile.
 *
 * Returns `null` when nobody is signed in. In mock mode (no Supabase
 * credentials) it returns a clearly-labelled local profile so the admin UI can
 * be developed — but only outside production. See `requireStaff`.
 */
export async function getStaffProfile(): Promise<StaffProfile | null> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") return null;
    return { id: "local", email: "local@saastally.dev", fullName: "Local Dev", role: "admin" };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const row = profile as unknown as {
    id: string;
    email: string | null;
    full_name: string | null;
    role: string;
  };

  // Anyone without an explicit staff role is treated as not staff.
  if (row.role !== "admin" && row.role !== "editor") return null;

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
  };
}

/**
 * Server-side authorisation gate. Every admin page and every mutating Server
 * Action must call this — hiding UI is not authorisation, and RLS is the second
 * line of defence, not the first.
 */
export async function requireStaff(minimumRole: StaffRole = "editor"): Promise<StaffProfile> {
  const profile = await getStaffProfile();

  if (!profile) redirect("/admin/login");
  if (minimumRole === "admin" && profile.role !== "admin") redirect("/admin");

  return profile;
}

export function canManageSettings(role: StaffRole): boolean {
  return role === "admin";
}
