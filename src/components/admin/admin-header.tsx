import { ThemeToggle } from "@/components/ui/theme-toggle";
import { dataMode } from "@/lib/supabase/config";
import type { StaffProfile } from "@/lib/auth";

export function AdminHeader({ profile, title }: { profile: StaffProfile; title: string }) {
  const mode = dataMode();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-5 backdrop-blur-xl sm:px-8">
      <h1 className="truncate text-base font-semibold">{title}</h1>

      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted sm:inline-flex"
          title={
            mode === "live"
              ? "Connected to Supabase"
              : "No Supabase credentials — reading development fixtures. Writes are disabled."
          }
        >
          <span
            className={
              mode === "live" ? "size-1.5 rounded-full bg-primary" : "size-1.5 rounded-full bg-warning"
            }
            aria-hidden="true"
          />
          {mode === "live" ? "Live database" : "Mock data"}
        </span>

        <ThemeToggle />

        <span className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-card-hover text-[11px] font-semibold">
            {(profile.fullName ?? profile.email ?? "?").slice(0, 1).toUpperCase()}
          </span>
          <span className="text-xs capitalize text-muted">{profile.role}</span>
        </span>
      </div>
    </header>
  );
}
