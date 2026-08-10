import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/ui/logo";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getStaffProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const profile = await getStaffProfile();
  if (profile) redirect("/admin");

  const configured = isSupabaseConfigured();

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2.5" aria-label="SaaSTally home">
          <LogoMark />
          <span className="text-[17px] font-semibold tracking-tight">
            SaaS<span className="text-primary">Tally</span>
          </span>
        </Link>

        <Card className="mt-8 p-6">
          <h1 className="text-lg font-semibold">Staff sign in</h1>
          <p className="mt-1.5 text-sm text-muted">
            SaaSTally has no public accounts. This is for editors and administrators only.
          </p>

          {configured ? (
            <LoginForm className="mt-6" />
          ) : (
            <div className="mt-6 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm leading-relaxed text-muted">
              Supabase is not configured, so authentication is unavailable. In development the admin
              is reachable without signing in; in production it is closed entirely until credentials
              are set.
            </div>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-subtle">
          <Link href="/" className="hover:text-muted">
            Back to SaaSTally
          </Link>
        </p>
      </div>
    </main>
  );
}
